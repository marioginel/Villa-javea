import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza este objeto con tus datos reales de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCkTjX-3LV4d2Ud7sQ_mlam2mSApMAbQPM",
  authDomain: "villa-javea-e5590.firebaseapp.com",
  projectId: "villa-javea-e5590",
  storageBucket: "villa-javea-e5590.firebasestorage.app",
  messagingSenderId: "1018497732551",
  appId: "1:1018497732551:web:2a70543dfdfa1373b9d3e2",
  measurementId: "G-G2ZQG9FP5M"
};

// Inicializar Firebase sin duplicar instancias en Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
Sustituye "TU_API_KEY", "TU_PROJECT_ID", etc., por tus datos reales.

Guarda los cambios (Commit changes).

Paso 3: Actualizar el código principal en
