import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persistence } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';

import { getFirebaseApp } from './app';

type FirebaseAuthModule = typeof firebaseAuth & {
  getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
};

const auth = firebaseAuth as FirebaseAuthModule;

function reactNativePersistence(): Persistence | undefined {
  try {
    if (typeof auth.getReactNativePersistence === 'function') {
      return auth.getReactNativePersistence(AsyncStorage);
    }
  } catch {
    /* Expo Go / web — fall back to memory persistence via getAuth */
  }
  return undefined;
}

/**
 * Try `initializeAuth` first — if Fast Refresh re-runs, Firebase throws because
 * auth already exists; we then fall back to `getAuth`.
 */
export function getFirebaseAuth() {
  const firebaseApp = getFirebaseApp();
  const persistence = reactNativePersistence();
  try {
    if (persistence) {
      return auth.initializeAuth(firebaseApp, { persistence });
    }
    return auth.initializeAuth(firebaseApp);
  } catch {
    return auth.getAuth(firebaseApp);
  }
}
