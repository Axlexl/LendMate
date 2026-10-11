/**
 * LendMate Firebase Auth Service
 *
 * Covers:
 *   - Email / Password  (register, sign-in)
 *   - Google Sign-In    (via expo-auth-session + IdToken flow)
 *   - Sign-out
 *   - Firestore user + borrower profile management
 *   - Persistent auth state listener
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO FILL IN THE GOOGLE WEB CLIENT ID
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Firebase Console → lendmate-80d0c → Authentication → Sign-in method
 *    → Google → Enable → Save
 * 2. Firebase Console → Project Settings → Your apps → Web app
 *    Copy the value that looks like:
 *      1060609617260-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
 * 3. Paste it as the value of GOOGLE_WEB_CLIENT_ID below.
 * 4. In Google Cloud Console → APIs & Services → Credentials →
 *    OAuth 2.0 Client IDs → "Web client (auto created by Google Service)"
 *    Add this URI to "Authorized redirect URIs":
 *      https://auth.expo.io/@<your-expo-username>/lendmate
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { auth, db } from './firebase';

// Closes the in-app browser automatically after OAuth redirect
WebBrowser.maybeCompleteAuthSession();

// ─── Google Web Client ID ─────────────────────────────────────────────────────
// Replace this placeholder with the real value (see instructions above).
const GOOGLE_WEB_CLIENT_ID =
  '1060609617260-16vkfn4nfvdop8hcjre4l6h0hrgcl4e9.apps.googleusercontent.com';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = 'borrower' | 'admin';

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  role: AppRole;
  termsAccepted: boolean;
  createdAt: Timestamp | null;
};

export type AuthResult =
  | { ok: true; user: User; profile: UserProfile }
  | { ok: false; error: string };

// ─── Firestore helpers ────────────────────────────────────────────────────────

/** Fetch the Firestore user profile for a given uid. Returns null if not found. */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Create user + borrower Firestore documents.
 * Called right after a new Firebase Auth account is created.
 */
async function createUserProfile(
  uid: string,
  email: string,
  fullName: string,
  phone: string,
  role: AppRole = 'borrower',
): Promise<UserProfile> {
  const now = serverTimestamp();

  const profile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    uid,
    email,
    fullName,
    phone,
    role,
    termsAccepted: false,
    createdAt: now,
  };

  // Write user profile document
  await setDoc(doc(db, 'users', uid), profile);

  // Write borrower profile document (1-to-1 with user for borrower role)
  if (role === 'borrower') {
    await setDoc(doc(db, 'borrowers', uid), {
      userId: uid,
      status: 'ACTIVE',
      activeLoans: 0,
      createdAt: now,
    });
  }

  // Return a local copy (serverTimestamp resolves server-side, so null here is safe)
  return { ...profile, createdAt: null };
}

/** Persist terms acceptance to Firestore. */
export async function acceptTerms(uid: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { termsAccepted: true, termsAcceptedAt: serverTimestamp() },
    { merge: true },
  );
}

// ─── Email / Password ─────────────────────────────────────────────────────────

export async function registerWithEmail(
  fullName: string,
  email: string,
  phone: string,
  password: string,
): Promise<AuthResult> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Set the display name on the Firebase Auth profile
    await updateProfile(cred.user, { displayName: fullName });

    const profile = await createUserProfile(cred.user.uid, email, fullName, phone, 'borrower');

    return { ok: true, user: cred.user, profile };
  } catch (e) {
    return { ok: false, error: mapAuthError(e) };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    let profile = await fetchUserProfile(cred.user.uid);

    // Safety net: create Firestore profile if it was somehow never written
    if (!profile) {
      profile = await createUserProfile(
        cred.user.uid,
        cred.user.email ?? email,
        cred.user.displayName ?? email.split('@')[0],
        '',
        'borrower',
      );
    }

    return { ok: true, user: cred.user, profile };
  } catch (e) {
    return { ok: false, error: mapAuthError(e) };
  }
}

export async function sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mapAuthError(e) };
  }
}

// ─── Google Sign-In ───────────────────────────────────────────────────────────

/**
 * Hook — call inside a React component.
 * Returns { request, response, promptAsync }.
 * Pass `response` to handleGoogleResponse() in a useEffect.
 */
export function useGoogleSignIn() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'lendmate' });

  const discovery: AuthSession.DiscoveryDocument = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
    },
    discovery,
  );

  return { request, response, promptAsync };
}

/**
 * Call this inside a useEffect whenever `response` from useGoogleSignIn changes.
 */
export async function handleGoogleResponse(
  response: AuthSession.AuthSessionResult,
): Promise<AuthResult> {
  if (response.type === 'cancel' || response.type === 'dismiss') {
    return { ok: false, error: 'Google sign-in was cancelled.' };
  }

  if (response.type === 'error') {
    return { ok: false, error: response.error?.message ?? 'Google sign-in failed.' };
  }

  if (response.type !== 'success') {
    return { ok: false, error: 'Google sign-in did not complete.' };
  }

  try {
    const idToken = response.params.id_token;
    if (!idToken) {
      return { ok: false, error: 'No ID token returned from Google.' };
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);

    let profile = await fetchUserProfile(cred.user.uid);

    // First-time Google sign-in — create Firestore documents
    if (!profile) {
      profile = await createUserProfile(
        cred.user.uid,
        cred.user.email ?? '',
        cred.user.displayName ?? cred.user.email?.split('@')[0] ?? 'User',
        '',
        'borrower',
      );
    }

    return { ok: true, user: cred.user, profile };
  } catch (e) {
    return { ok: false, error: mapAuthError(e) };
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── Auth state listener ──────────────────────────────────────────────────────

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function — call it in a useEffect cleanup.
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// ─── Firebase error → readable message ───────────────────────────────────────

function mapAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';

  const messages: Record<string, string> = {
    // Registration
    'auth/email-already-in-use':   'That email is already registered. Try signing in.',
    'auth/invalid-email':           'Enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/operation-not-allowed':   'Email/password sign-in is not enabled. Contact support.',

    // Sign-in
    'auth/user-not-found':          'No account found with that email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-credential':      'Incorrect email or password.',
    'auth/user-disabled':           'This account has been disabled. Contact support.',

    // Rate limiting / network
    'auth/too-many-requests':       'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed':  'Network error. Check your connection and try again.',

    // Google OAuth
    'auth/popup-closed-by-user':         'Sign-in was cancelled.',
    'auth/cancelled-popup-request':      'Sign-in was cancelled.',
    'auth/popup-blocked':                'Popup was blocked. Please allow popups and try again.',
    'auth/account-exists-with-different-credential':
      'An account with this email already exists using a different sign-in method.',
  };

  if (messages[code]) return messages[code];

  // Log unknown codes in development
  if (__DEV__ && code) console.warn('[LendMate Auth] Unhandled Firebase error code:', code);

  return 'Something went wrong. Please try again.';
}
