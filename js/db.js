/*
  db.js
  -----
  Camada de acesso ao banco de dados (Firebase Firestore).
  Toda a comunicação com o banco fica isolada aqui — o resto do app
  (app.js) só chama estas funções e não sabe como os dados são guardados.

  COMO CONFIGURAR:
  1. Crie uma conta grátis em https://console.firebase.google.com
  2. Crie um novo projeto (pode desativar o Google Analytics, não precisa).
  3. No menu lateral, vá em "Compilação" > "Firestore Database" > "Criar
     banco de dados". Escolha "Iniciar no modo de teste" por enquanto.
  4. Vá em Configurações do projeto (ícone de engrenagem) > geral > role até
     "Seus apps" > clique no ícone "</>" (Web) > registre o app.
  5. Copie o objeto "firebaseConfig" que aparecer e cole no lugar do
     FIREBASE_CONFIG abaixo.
  6. Depois de testar, ajuste as regras de segurança do Firestore (veja
     firestore.rules neste projeto e o README).
*/

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBXcMzXwZSGo6JsfXuzWQbkkqaH8zmBU8Y",
    authDomain: "catalogo-colaborativo.firebaseapp.com",
    projectId: "catalogo-colaborativo",
    storageBucket: "catalogo-colaborativo.firebasestorage.app",
    messagingSenderId: "719911568826",
    appId: "1:719911568826:web:7f0e32c0fdebd8ea728983"
  };

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

const DB = {
  /** Busca todos os itens do catálogo, mais antigos primeiro */
  async getItems() {
    try {
      const snap = await firestore.collection("items").orderBy("createdAt", "asc").get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Erro ao buscar itens:", err);
      return [];
    }
  },

    /** Cria um novo item no catálogo */
  async addItem(name) {
    try {
      const ref = await firestore.collection("items").add({
        name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      const doc = await ref.get();
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      console.error("Erro ao criar item:", err);
      return null;
    }
  },

  /** Busca todos os registros de preço, mais recentes primeiro */
  async getPrices() {
    try {
      const snap = await firestore.collection("price_records").orderBy("date", "desc").get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Erro ao buscar preços:", err);
      return [];
    }
  },

  /** Registra um novo preço visto por alguém */
  async addPrice({ itemId, price, unit, place, person, date }) {
    try {
      const ref = await firestore.collection("price_records").add({
        item_id: itemId,
        price,
        unit,
        place,
        person,
        date,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      const doc = await ref.get();
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      console.error("Erro ao registrar preço:", err);
      return null;
    }
  },
};
