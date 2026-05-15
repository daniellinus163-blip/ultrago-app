import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';

import type { AppRole, UserLastKnownLocation, UserProfile } from '../types/user';
import {
  loginWithEmail,
  logout,
  registerWithEmail,
  sendPasswordResetToEmail,
} from '../services/auth/emailAuth';
import { getFirebaseAuth } from '../services/firebase/auth';
import { isFirebaseConfigured } from '../services/firebase/env';
import {
  createUserProfileFromEmailRegistration,
  ensureUserProfile,
  getUserProfile,
  saveUserPushToken,
} from '../services/users/userProfile';
import { registerForPushNotificationsAsync } from '../services/notifications/push';
import { isExpoGoClient } from '../lib/expoRuntime';
import { hasEnteredProfileBasics } from '../utils/profilePhotoGate';

export type EmailSignUpParams = {
  email: string;
  password: string;
  displayName: string;
  phoneNumber: string;
  appRole: AppRole;
  /** Local `file://` or content URI from image picker. */
  photoUri?: string | null;
  lastKnownLocation: UserLastKnownLocation;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  initializing: boolean;
  /** False until `.env` has EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID. */
  firebaseConfigured: boolean;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (params: EmailSignUpParams) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseConfigured] = useState(() => isFirebaseConfigured());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      return;
    }
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    if (!u) {
      setProfile(null);
      return;
    }
    const p = await getUserProfile(u.uid);
    setProfile(p);
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      setInitializing(false);
      return;
    }
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      void (async () => {
        try {
          if (nextUser) {
            let p = await getUserProfile(nextUser.uid);
            if (!p) {
              await ensureUserProfile({
                uid: nextUser.uid,
                email: nextUser.email ?? '',
                displayName: nextUser.displayName?.trim() || 'UltraGo member',
              });
              p = await getUserProfile(nextUser.uid);
            }
            setProfile(p);
          } else {
            setProfile(null);
          }
        } catch (e) {
          if (__DEV__) {
            console.warn('[Auth] Profile load failed', e);
          }
          setProfile(null);
        } finally {
          setInitializing(false);
        }
      })();
    });
    } catch (e) {
      if (__DEV__) {
        console.warn('[Auth] Firebase auth failed to start', e);
      }
      setInitializing(false);
    }
    return () => {
      unsub?.();
    };
  }, [firebaseConfigured]);

  /** Phase 7: persist Expo push token on the user doc for FCM / server pushes. */
  useEffect(() => {
    if (!user || !firebaseConfigured) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token && !cancelled) {
          await saveUserPushToken(user.uid, token);
        }
      } catch {
        /* Simulators / denied permissions — non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, firebaseConfigured]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Add Firebase keys to .env and restart Expo before signing in.');
    }
    await loginWithEmail(email, password);
  }, []);

  const signUpWithEmail = useCallback(
    async (params: EmailSignUpParams) => {
      if (!isFirebaseConfigured()) {
        throw new Error('Add Firebase keys to .env and restart Expo before signing up.');
      }
      const u = await registerWithEmail(params.email, params.password, params.displayName);
      let photoUrl: string | null = null;
      const mayUploadPhoto =
        Boolean(params.photoUri?.trim()) &&
        hasEnteredProfileBasics({
          displayName: params.displayName,
          phone: params.phoneNumber,
          hasLocation: Boolean(params.lastKnownLocation),
        });
      if (mayUploadPhoto && params.photoUri?.trim()) {
        const { uploadUserProfilePhotoFromUri } = await import('../services/firebase/storage');
        photoUrl = await uploadUserProfilePhotoFromUri(u.uid, params.photoUri.trim(), 'image/jpeg');
        await updateProfile(u, { photoURL: photoUrl });
      }
      await createUserProfileFromEmailRegistration({
        uid: u.uid,
        email: u.email ?? params.email.trim(),
        displayName: params.displayName.trim() || u.displayName || 'Member',
        phoneNumber: params.phoneNumber.trim(),
        appRole: params.appRole,
        photoUrl,
        lastKnownLocation: params.lastKnownLocation,
      });
      await refreshProfile();
    },
    [refreshProfile],
  );

  const sendPasswordResetEmailFn = useCallback(async (email: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Add Firebase keys to .env and restart Expo first.');
    }
    await sendPasswordResetToEmail(email);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Add Firebase keys to .env and restart Expo before signing in.');
    }
    if (isExpoGoClient()) {
      throw new Error(
        'Google Sign-In is not available in Expo Go. Use email sign-in, or run `npx expo run:android` for Google.',
      );
    }
    const mod = await import('../services/auth/googleSignIn');
    const run = mod.signInWithGoogleFirebase;
    if (typeof run !== 'function') {
      throw new Error(
        'Google Sign-In native module is missing. Build a dev client with `npx expo run:android` (Expo Go does not include Google Sign-In).',
      );
    }
    await run();
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    if (!u) {
      throw new Error('Google sign-in finished but Firebase has no user.');
    }
    await ensureUserProfile({
      uid: u.uid,
      email: u.email ?? '',
      displayName: u.displayName?.trim() || u.email?.split('@')[0] || 'Rider',
    });
    await refreshProfile();
  }, [refreshProfile]);

  const signOutUser = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      return;
    }
    await logout();
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      initializing,
      firebaseConfigured,
      refreshProfile,
      signInWithEmail,
      signInWithGoogle,
      signUpWithEmail,
      sendPasswordResetEmail: sendPasswordResetEmailFn,
      signOutUser,
    }),
    [
      user,
      profile,
      initializing,
      firebaseConfigured,
      refreshProfile,
      signInWithEmail,
      signInWithGoogle,
      signUpWithEmail,
      sendPasswordResetEmailFn,
      signOutUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
