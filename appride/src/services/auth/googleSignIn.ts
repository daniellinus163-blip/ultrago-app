import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

import { getGoogleSignInModule } from '../../lib/googleSignInModule';
import { isExpoGoClient, isGoogleSignInNativeEnabled } from '../../lib/expoRuntime';
import { getFirebaseAuth } from '../firebase/auth';

let configured = false;

function getWebClientId(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;
}

/** Call once before sign-in; safe to call multiple times. */
export function configureGoogleSignIn(): void {
  if (!isGoogleSignInNativeEnabled()) {
    return;
  }
  const webClientId = getWebClientId();
  if (!webClientId || configured) {
    return;
  }
  const { GoogleSignin } = getGoogleSignInModule();
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getWebClientId());
}

/**
 * Opens the Google account picker (native), then signs into Firebase with the ID token.
 * Requires a dev build — not Expo Go.
 */
export async function signInWithGoogleFirebase(): Promise<void> {
  if (isExpoGoClient() || !isGoogleSignInNativeEnabled()) {
    throw new Error(
      'Google Sign-In is not available in Expo Go. Use email sign-in here, or run `npx expo run:android` for Google.',
    );
  }
  const webClientId = getWebClientId();
  if (!webClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Add your Firebase “Web client ID” to appride/.env and restart Expo.',
    );
  }
  const { GoogleSignin, statusCodes } = getGoogleSignInModule();
  configureGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch {
    throw new Error('Google Play Services are required for Google sign-in on this device.');
  }

  const response = await GoogleSignin.signIn();
  if (response.type === 'cancelled') {
    const err = new Error('SIGN_IN_CANCELLED');
    (err as Error & { code?: string }).code = statusCodes.SIGN_IN_CANCELLED;
    throw err;
  }

  let idToken = response.data.idToken ?? null;
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken;
  }
  if (!idToken) {
    throw new Error(
      'No Google ID token returned. Confirm SHA-1 in Firebase, package com.ultrago.app, and Web client ID.',
    );
  }

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(getFirebaseAuth(), credential);
}

export async function signOutGoogle(): Promise<void> {
  if (!isGoogleSignInNativeEnabled()) {
    return;
  }
  try {
    const { GoogleSignin } = getGoogleSignInModule();
    configureGoogleSignIn();
    await GoogleSignin.signOut();
  } catch {
    /* not signed in with Google or native module unavailable */
  }
}

export function formatGoogleSignInError(e: unknown): string {
  const { statusCodes } = getGoogleSignInModule();
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code === statusCodes.SIGN_IN_CANCELLED) {
    return 'SIGN_IN_CANCELLED';
  }
  if (e instanceof Error && e.message === 'SIGN_IN_CANCELLED') {
    return 'SIGN_IN_CANCELLED';
  }
  if (code === statusCodes.IN_PROGRESS) {
    return 'Sign-in already in progress. Try again in a moment.';
  }
  if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'Update Google Play Services, then try again.';
  }
  if (e instanceof Error) {
    return e.message;
  }
  return 'Google sign-in failed.';
}
