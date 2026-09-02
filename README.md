# Preço na Praça

Catálogo colaborativo de preços por kilo e por unidade, com histórico de quem
registrou, onde e quando.

## Estrutura do projeto

```
preco-na-praca/
├── index.html            → estrutura da página
├── manifest.json          → configuração do PWA (ícone, nome, cores)
├── sw.js                  → service worker (cache + habilita instalar no celular)
├── firestore.rules        → regras de segurança do banco (Firestore)
├── css/
│   └── style.css          → todo o visual
├── js/
│   ├── db.js               → toda a comunicação com o banco de dados (Firebase)
│   └── app.js               → toda a lógica de interface (render, modais, formulários)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## 1. Configurar o banco de dados (Firebase)

1. Crie uma conta grátis em https://console.firebase.google.com (usa sua
   conta Google) e clique em **Criar projeto**. Pode desativar o Google
   Analytics, não é necessário.
2. No menu lateral, vá em **Compilação → Firestore Database** →
   **Criar banco de dados** → escolha uma região próxima (ex: `southamerica-east1`
   pra São Paulo) → comece no **modo de teste** por enquanto.
3. Ainda no menu lateral, vá em **Configurações do projeto** (ícone de
   engrenagem, no topo) → aba **Geral** → desça até **Seus apps** → clique
   no ícone **`</>`** (Web) → dê um nome e registre o app.
4. O Firebase vai mostrar um objeto `firebaseConfig`. Copie ele inteiro e
   cole em `js/db.js`, substituindo:
   ```js
   const FIREBASE_CONFIG = {
     apiKey: "COLE_AQUI",
     authDomain: "COLE_AQUI.firebaseapp.com",
     projectId: "COLE_AQUI",
     storageBucket: "COLE_AQUI.appspot.com",
     messagingSenderId: "COLE_AQUI",
     appId: "COLE_AQUI",
   };
   ```
5. Vá em **Firestore Database → Regras**, apague o que estiver lá e cole o
   conteúdo de `firestore.rules` → **Publicar**. Isso substitui o "modo de
   teste" (que expira em 30 dias) por regras permanentes: qualquer um pode
   ler e criar itens/preços, mas ninguém pode editar ou apagar um registro
   já existente — mantém o histórico confiável.

As coleções `items` e `price_records` são criadas sozinhas no Firestore
assim que o primeiro item/preço for salvo pelo app — não precisa criar
tabela antes, diferente de um banco SQL.

> Nota de segurança: como o app não tem login, qualquer pessoa com o link
> pode ler e criar registros (é assim que o "todo mundo registra preço"
> funciona). Se no futuro você quiser controlar quem participa, dá pra
> adicionar Firebase Authentication e ajustar `firestore.rules`.

## 2. Testar localmente

Como o app usa `fetch` e um service worker, ele precisa rodar num servidor
local (não abre direto clicando no arquivo). Com Python instalado:

```bash
cd preco-na-praca
python3 -m http.server 8000
```

Depois abra http://localhost:8000 no navegador.

## 3. Publicar (para poder instalar no celular)

Para o "adicionar à tela inicial" funcionar de verdade, o site precisa estar
em um endereço https real. As opções mais simples e gratuitas:

- **Netlify** (arrastar a pasta em https://app.netlify.com/drop)
- **Vercel** (`vercel deploy` na pasta do projeto)
- **GitHub Pages** (subir a pasta pra um repositório e ativar Pages)

Depois de publicado:
- **Android/Chrome**: abre um banner de "Instalar app" automaticamente, ou
  vá no menu ⋮ → "Adicionar à tela inicial".
- **iPhone/Safari**: toque em Compartilhar → "Adicionar à Tela de Início".

## 4. Personalizar

- Cores e fontes: `css/style.css`, variáveis no topo (`:root`).
- Ícone do app: `icons/icon-192.png` e `icons/icon-512.png` (troque pelos
  seus, mantendo o mesmo tamanho).
