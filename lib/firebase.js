import Constants from 'expo-constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, OAuthProvider, signInWithCredential, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, signOut, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = Constants.expoConfig?.extra?.firebase || {};

const app = getApps().length ? getApp() : initializeApp(config);

let _auth;
try {
  _auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  const { getAuth } = require('firebase/auth');
  _auth = getAuth(app);
}
export const auth = _auth;

export async function signInWithGoogleIdToken(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signInWithLinkedInProfile(linkedInData) {
  // Backend returns { profile: { email, name, picture, sub }, firebaseToken }
  // We use the Firebase custom token to sign in.
  if (!linkedInData || !linkedInData.firebaseToken) {
    throw new Error('Invalid LinkedIn data from backend');
  }
  const result = await signInWithCustomToken(auth, linkedInData.firebaseToken);
  // Update profile from LinkedIn data if missing
  if (linkedInData.name && !result.user.displayName) {
    try { await updateProfile(result.user, { displayName: linkedInData.name, photoURL: linkedInData.picture || null }); } catch {}
  }
  return result.user;
}

export function userToProfile(u) {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    name: u.displayName,
    photo: u.photoURL,
    provider: u.providerData?.[0]?.providerId || 'firebase',
  };
}

// ============ Email/password auth ============
export async function signUpWithEmail(email, password, name) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (name && name.trim()) {
    try { await updateProfile(result.user, { displayName: name.trim() }); } catch {}
  }
  return result.user;
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  // Sign out of Firebase
  try { await signOut(auth); } catch {}
  // Also clear Google's cached account so user can pick a different one next time
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    const isSignedIn = await GoogleSignin.isSignedIn?.();
    if (isSignedIn) {
      try { await GoogleSignin.revokeAccess(); } catch {}
      try { await GoogleSignin.signOut(); } catch {}
    } else {
      // Some versions don't expose isSignedIn — just try both anyway
      try { await GoogleSignin.signOut(); } catch {}
    }
  } catch {}
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Map Firebase auth error codes to friendly messages
export function authErrorMessage(err) {
  const code = err?.code || '';
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/invalid-email': 'Invalid email address',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Incorrect email or password',
    'auth/too-many-requests': 'Too many attempts. Try again later',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/operation-not-allowed': 'Email/password sign-in not enabled in Firebase',
  };
  return map[code] || err?.message || 'Sign-in failed';
}


// Apple Sign-In — required by App Store Guideline 4.8 when other social logins exist.
// rawNonce must be the UNHASHED value; Apple receives the SHA256 hash of it.
export async function signInWithAppleIdToken(identityToken, rawNonce) {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce });
  const result = await signInWithCredential(auth, credential);
  return result.user;
}
