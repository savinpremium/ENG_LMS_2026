
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDneDiUzFALG_DcH1gNJmzB0WIddQcDxsA",
  authDomain: "lms-e-6f847.firebaseapp.com",
  databaseURL: "https://lms-e-6f847-default-rtdb.firebaseio.com",
  projectId: "lms-e-6f847",
  storageBucket: "lms-e-6f847.firebasestorage.app",
  messagingSenderId: "500541616456",
  appId: "1:500541616456:web:db41d2f2b2be2787c0c37d",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
