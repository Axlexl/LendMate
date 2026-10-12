import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAcjxyyVOYxJknkpiioo5PyVAD241nFdUY',
  authDomain: 'lendmate-80d0c.firebaseapp.com',
  projectId: 'lendmate-80d0c',
  storageBucket: 'lendmate-80d0c.firebasestorage.app',
  messagingSenderId: '1060609617260',
  appId: '1:1060609617260:web:0e180de9f56792add65749',
  measurementId: 'G-NTTDE749T1',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use getAuth if already initialized (handles hot reload), otherwise init fresh
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
