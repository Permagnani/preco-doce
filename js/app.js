/*
  app.js
  ------
  Toda a lógica de interface: renderizar a grade de itens, abrir modais,
  validar formulários. Os dados vêm sempre de db.js (nunca direto do Supabase
  aqui), então se um dia vocês trocarem de banco, só db.js precisa mudar.
*/

let items = [];
let prices = [];
let currentUnit = 'kg';
let detailItemId = null;
let currentUser = null;

function todayStr(){ return new Date().toISOString().slice(0,10); }
function fmtDate(d){
  try{
    const [y,m,day] = d.split('-');
    return day+'/'+m+'/'+y;
  }catch(e){ return d; }
}
function money(v){ return 'R$ ' + Number(v).toFixed(2).replace('.',','); }
function escapeHtml(s){
  return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function loadData(){
  items = await DB.getItems();
  prices = await DB.getPrices();
  render();
  populateItemSelect();
}

function lowestPrice(itemId, unit){
  const list = prices.filter(p => p.item_id === itemId && p.unit === unit);
  if(!list.length) return null;
  return list.reduce((min,p)=> p.price < min.price ? p : min, list[0]);
}

function render(){
  const gridArea = document.getElementById('gridArea');
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const filtered = items.filter(it => it.name.toLowerCase().includes(q) || (it.category||'').toLowerCase().includes(q));

  if(!items.length){
    gridArea.innerHTML = `<div class="empty-state">
      <div class="big">Catálogo vazio</div>
      <div>Adicione o primeiro item pra começar a registrar preços.</div>
    </div>`;
    return;
  }
  if(!filtered.length){
    gridArea.innerHTML = `<div class="empty-state">
      <div class="big">Nada encontrado</div>
      <div>Tente buscar por outro nome ou categoria.</div>
    </div>`;
    return;
  }

  gridArea.innerHTML = `<div class="grid">${filtered.map(it => {
    const kg = lowestPrice(it.id,'kg');
    const un = lowestPrice(it.id,'unidade');
    const count = prices.filter(p=>p.item_id===it.id).length;
    return `
      <div class="tag" data-id="${it.id}">
        <div class="tag-cat">${escapeHtml(it.category || 'geral')}</div>
        <div class="tag-name">${escapeHtml(it.name)}</div>
        <div class="tag-prices">
          <div class="price-box ${kg?'':'empty'}">
            <div class="unit-label">por Kg</div>
            <div class="val">${kg? money(kg.price) : '—'}</div>
          </div>
          <div class="price-box ${un?'':'empty'}">
            <div class="unit-label">por Un.</div>
            <div class="val">${un? money(un.price) : '—'}</div>
          </div>
        </div>
        <div class="tag-foot"><span>${count} registro${count===1?'':'s'}</span><span>ver histórico →</span></div>
      </div>`;
  }).join('')}</div>`;

  document.querySelectorAll('.tag').forEach(card=>{
    card.addEventListener('click', ()=> openDetail(card.dataset.id));
  });
}

function populateItemSelect(){
  const sel = document.getElementById('priceItemSelect');
  sel.innerHTML = items.map(it => `<option value="${it.id}">${escapeHtml(it.name)}</option>`).join('');
}

/* MODAL open/close */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

function openDetail(itemId){
  detailItemId = itemId;
  const item = items.find(i=>i.id===itemId);
  if(!item) return;
  document.getElementById('detailName').textContent = item.name;
  document.getElementById('detailCat').textContent = item.category || 'geral';
  const list = prices.filter(p=>p.item_id===itemId).sort((a,b)=> b.date.localeCompare(a.date));
  const histEl = document.getElementById('detailHistory');
  if(!list.length){
    histEl.innerHTML = `<div class="loading-note">Nenhum preço registrado ainda.</div>`;
  }else{
    histEl.innerHTML = list.map(p=>`
      <div class="history-item">
        <div class="history-left">
          <div class="place">${escapeHtml(p.place)}</div>
          <div class="meta">${escapeHtml(p.person)} · ${fmtDate(p.date)}</div>
        </div>
        <div class="history-price">${money(p.price)} <span style="font-size:11px;font-family:'IBM Plex Mono',monospace;color:var(--ink-soft);">/${p.unit==='kg'?'kg':'un'}</span></div>
      </div>
    `).join('');
  }
  openModal('overlayDetail');
}

function openAddPriceModal(preselectId){
  document.getElementById('errPrice').classList.remove('show');
  document.getElementById('priceValue').value='';
  document.getElementById('priceLocal').value='';
  document.getElementById('priceData').value = todayStr();
  document.getElementById('loggedAsNote').textContent = currentUser
    ? `Registrando como ${currentUser.displayName || currentUser.email}`
    : '';
  currentUnit = 'kg';
  document.querySelectorAll('.unit-toggle button').forEach(b=>b.classList.toggle('active', b.dataset.unit==='kg'));
  if(!items.length){
    alert('Cadastre um item primeiro.');
    return;
  }
  populateItemSelect();
  if(preselectId){ document.getElementById('priceItemSelect').value = preselectId; }
  openModal('overlayPrice');
}

function setupEvents(){
  document.querySelectorAll('[data-close]').forEach(el=>{
    el.addEventListener('click', ()=> closeModal(el.dataset.close));
  });
  document.querySelectorAll('.overlay').forEach(ov=>{
    ov.addEventListener('click', (e)=>{ if(e.target === ov) closeModal(ov.id); });
  });

  document.getElementById('openAddItem').addEventListener('click', ()=>{
    document.getElementById('itemName').value='';
    document.getElementById('itemCategory').value='';
    document.getElementById('errItem').classList.remove('show');
    openModal('overlayItem');
  });

  document.getElementById('saveItem').addEventListener('click', async ()=>{
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value.trim();
    if(!name){ document.getElementById('errItem').classList.add('show'); return; }
    const created = await DB.addItem(name, category);
    if(created){ items.push(created); }
    populateItemSelect();
    render();
    closeModal('overlayItem');
  });

  document.getElementById('openAddPrice').addEventListener('click', ()=> openAddPriceModal(null));
  document.getElementById('detailAddPrice').addEventListener('click', ()=>{
    closeModal('overlayDetail');
    openAddPriceModal(detailItemId);
  });

  document.querySelectorAll('.unit-toggle button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      currentUnit = btn.dataset.unit;
      document.querySelectorAll('.unit-toggle button').forEach(b=>b.classList.toggle('active', b===btn));
    });
  });

  document.getElementById('savePrice').addEventListener('click', async ()=>{
    const itemId = document.getElementById('priceItemSelect').value;
    const price = parseFloat(document.getElementById('priceValue').value);
    const place = document.getElementById('priceLocal').value.trim();
    const date = document.getElementById('priceData').value || todayStr();
    const person = currentUser ? (currentUser.displayName || currentUser.email) : 'Anônimo';

    if(!itemId || !price || price<=0 || !place || !currentUser){
      document.getElementById('errPrice').classList.add('show');
      return;
    }
    const created = await DB.addPrice({ itemId, price, unit: currentUnit, place, person, date, uid: currentUser.uid });
    if(created){ prices.push(created); }
    render();
    closeModal('overlayPrice');
  });

  document.getElementById('searchInput').addEventListener('input', render);
}

function registerServiceWorker(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(err=>{
      console.warn('Service worker não registrado:', err);
    });
  }
}

function showAuthScreen(){
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appContent').style.display = 'none';
}

function showApp(user){
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appContent').style.display = 'block';
  document.getElementById('userName').textContent = user.displayName || user.email;
}

function setupAuthEvents(){
  document.getElementById('googleSignInBtn').addEventListener('click', async ()=>{
    try{
      await Auth.signInWithGoogle();
    }catch(err){
      console.error('Erro no login:', err);
      alert('Não foi possível entrar com o Google. Tente de novo.');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async ()=>{
    await Auth.signOut();
  });

  Auth.onAuthStateChanged(async (user)=>{
    currentUser = user;
    if(user){
      showApp(user);
      await loadData();
    }else{
      showAuthScreen();
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  setupEvents();
  setupAuthEvents();
  registerServiceWorker();
});