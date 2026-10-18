// firebase-config.js — LV Spices Cleaning Register
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3pKpGVa4rJq9X8mNvKLdEfTgUhWxYzBs",
  authDomain: "lv-spices-cleaning.firebaseapp.com",
  projectId: "lv-spices-cleaning",
  storageBucket: "lv-spices-cleaning.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
