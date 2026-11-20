/**
 * ============================================================================
 * TaskFlow Authentication — Firebase Configuration
 * ============================================================================
 * Responsável pela inicialização do Firebase e exportação da instância do
 * Authentication e Firestore através do SDK modular oficial do Firebase.
 *
 * Tecnologias: JavaScript puro (ES Modules) e Firebase SDK oficial.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// Configuração pública oficial do Firebase do projeto TaskFlow
export const firebaseConfig = {
  apiKey: "AIzaSyA9uWffYJvE_ixKMLChjexTwHDgiLtdV-I",
  authDomain: "to-do-list-232fd.firebaseapp.com",
  projectId: "to-do-list-232fd",
  storageBucket: "to-do-list-232fd.firebasestorage.app",
  messagingSenderId: "831519152195",
  appId: "1:831519152195:web:2f2019a4d1cc9eeb315cf6"
};

// Inicialização da aplicação Firebase
const app = initializeApp(firebaseConfig);

// Inicialização do Firebase Authentication (mantém browserLocalPersistence por padrão na web)
const auth = getAuth(app);

// Inicialização do Firestore para integração com o software TaskFlow
const db = getFirestore(app);

export { app, auth, db };

// Exposição global segura para interoperabilidade
if (typeof window !== "undefined") {
  window.__firebase = { app, auth, db };
}
