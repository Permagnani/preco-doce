const googleProvider = new firebase.auth.GoogleAuthProvider();

const Auth = {
  /** Abre o popup de login do Google */
  async signInWithGoogle() {
    const result = await firebase.auth().signInWithPopup(googleProvider);
    await this.ensureUserProfile(result.user);
    return result.user;
  },

  /** Desloga a pessoa */
  async signOut() {
    await firebase.auth().signOut();
  },

  /** Chama callback(user) sempre que o estado de login mudar (user é null se deslogado) */
  onAuthStateChanged(callback) {
    firebase.auth().onAuthStateChanged(callback);
  },

  /** Cria o registro da pessoa em /users na primeira vez que ela loga */
  async ensureUserProfile(user) {
    const ref = firestore.collection('users').doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        name: user.displayName || user.email,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  },
};