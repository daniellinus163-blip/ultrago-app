import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

import { assertFirebaseConfigured, getFirebaseOptions } from './env';

let app: FirebaseApp | null = null;

/**
 * Single Firebase app instance for the whole JS bundle.
 * `getApps().length` prevents double-initialization during Fast Refresh.
 */
export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }
  assertFirebaseConfigured();
  if (!getApps().length) {
    app = initializeApp(getFirebaseOptions());
  } else {
    app = getApp();
  }
  return app;
}
