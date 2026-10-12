/**
 * Run once to write the admin Firestore profile.
 * The Auth user already exists — this just creates the users/{uid} document.
 *
 * Usage:  node scripts/seed-admin.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAcjxyyVOYxJknkpiioo5PyVAD241nFdUY',
  authDomain: 'lendmate-80d0c.firebaseapp.com',
  projectId: 'lendmate-80d0c',
  storageBucket: 'lendmate-80d0c.firebasestorage.app',
  messagingSenderId: '1060609617260',
  appId: '1:1060609617260:web:0e180de9f56792add65749',
};

const ADMIN_EMAIL    = 'admin@lendmate.ph';
const ADMIN_PASSWORD = 'LendMate@Admin2026';
const ADMIN_UID      = 'rPKhQ7FopLgcP08GI6CBqfKYJbG2'; // confirmed from previous run

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

async function run() {
  // Sign in so Firestore sees an authenticated request
  console.log('Signing in as admin…');
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('✅ Signed in. Writing Firestore document…');

  await setDoc(doc(db, 'users', ADMIN_UID), {
    uid:           ADMIN_UID,
    email:         ADMIN_EMAIL,
    fullName:      'LendMate Admin',
    phone:         '',
    role:          'admin',
    termsAccepted: true,
  });

  console.log('✅ users/' + ADMIN_UID + ' written successfully.');
  console.log('');
  console.log('Sign in with:');
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Error:', e.code ?? e.message);
  process.exit(1);
});
