// firebase-config.js — LV Spices Cleaning Register
// Project: cleaning-7e293 | Collection: daily_cleaning_records

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDP2vudrt_xBl8GG8UyeDcJj0dUt-_2DJ4",
  authDomain: "cleaning-7e293.firebaseapp.com",
  projectId: "cleaning-7e293",
  storageBucket: "cleaning-7e293.firebasestorage.app",
  messagingSenderId: "528858645208",
  appId: "1:528858645208:web:72a0bdc9ced98e61460dad"
};

export const COLLECTION_NAME = "daily_cleaning_records";

let db = null;
let isConnected = false;

export function updateCloudBadge(connected) {
  isConnected = connected;
  const badge = document.getElementById('cloud-status-badge');
  const dot = document.getElementById('cloud-status-dot');
  const text = document.getElementById('cloud-status-text');
  if (badge && text) {
    if (connected) {
      badge.className = 'cloud-badge connected';
      text.textContent = 'Cloud Synced (Firestore)';
    } else {
      badge.className = 'cloud-badge offline';
      text.textContent = 'Local / Offline Mode';
    }
  }
}

export function initFirebase() {
  if (db) return db;
  try {
    const app = getApps().find(a => a.name === 'cleaning') || initializeApp(firebaseConfig, 'cleaning');
    db = getFirestore(app);
    console.log('[Firebase] Cleaning DB connected: cleaning-7e293');
    updateCloudBadge(true);
    return db;
  } catch (err) {
    console.warn('[Firebase] Init notice:', err);
    updateCloudBadge(false);
    return null;
  }
}

export async function saveRecordToCloud(dateStr, recordData) {
  const database = initFirebase();
  if (!database) return false;
  try {
    const docRef = doc(database, COLLECTION_NAME, dateStr);
    await setDoc(docRef, {
      ...recordData,
      date: dateStr,
      updatedAt: Date.now()
    }, { merge: true });
    updateCloudBadge(true);
    return true;
  } catch (err) {
    console.error('[Firebase] Save error:', err);
    updateCloudBadge(false);
    return false;
  }
}

export async function loadRecordFromCloud(dateStr) {
  const database = initFirebase();
  if (!database) return null;
  try {
    const docRef = doc(database, COLLECTION_NAME, dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      updateCloudBadge(true);
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('[Firebase] Load error for', dateStr, err);
    return null;
  }
}

export async function loadAllRecordsFromCloud() {
  const database = initFirebase();
  if (!database) return {};
  try {
    const q = query(collection(database, COLLECTION_NAME), orderBy("date", "desc"), limit(200));
    const snap = await getDocs(q);
    const map = {};
    snap.forEach(d => {
      map[d.id] = d.data();
    });
    updateCloudBadge(true);
    return map;
  } catch (err) {
    console.warn('[Firebase] Bulk load error:', err);
    return {};
  }
}

// Auto-initialize
try {
  initFirebase();
} catch (e) {}
