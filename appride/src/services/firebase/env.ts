import Constants from 'expo-constants';

/**
 * Reads Firebase web config from `app.config.ts` → `expo.extra.firebase`.
 * Students copy `.env.example` → `.env` and paste keys from the Firebase console
 * (Project settings → Your apps → Web app).
 */
function cleanEnvValue(value: string | undefined): string {
  return (value ?? '').trim().replace(/^['"]|['"]$/g, '');
}

/** Normalized default bucket (e.g. `my-project.firebasestorage.app`). */
export function resolveStorageBucket(): string {
  const opts = getFirebaseOptions();
  let bucket = cleanEnvValue(opts.storageBucket);
  if (bucket) {
    return bucket.replace(/^gs:\/\//, '');
  }
  const projectId = cleanEnvValue(opts.projectId);
  if (projectId) {
    return `${projectId}.firebasestorage.app`;
  }
  return '';
}

export function getFirebaseOptions() {
  const extra = Constants.expoConfig?.extra as
    | { firebase?: Record<string, string> }
    | undefined;
  const firebase = extra?.firebase ?? {};
  const projectId = cleanEnvValue(firebase.projectId);
  const storageBucket = cleanEnvValue(firebase.storageBucket) || (projectId ? `${projectId}.firebasestorage.app` : '');
  return {
    apiKey: cleanEnvValue(firebase.apiKey),
    authDomain: cleanEnvValue(firebase.authDomain),
    projectId,
    storageBucket,
    messagingSenderId: cleanEnvValue(firebase.messagingSenderId),
    appId: cleanEnvValue(firebase.appId),
  };
}

/** True when the Expo extra / `.env` values needed to start Firebase are present. */
export function isFirebaseConfigured(): boolean {
  const opts = getFirebaseOptions();
  return Boolean(opts.apiKey && opts.projectId);
}

export function assertFirebaseConfigured() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Copy `.env.example` to `.env`, add your EXPO_PUBLIC_FIREBASE_* keys, then restart Expo.',
    );
  }
}
