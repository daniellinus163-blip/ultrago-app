import { isGoogleSignInNativeEnabled } from './expoRuntime';
import * as stub from '../shims/google-signin.stub';

type GoogleSignInModule = typeof stub;

let cached: GoogleSignInModule | null = null;

/** Loads real Google Sign-In only in dev/production builds — never in Expo Go. */
export function getGoogleSignInModule(): GoogleSignInModule {
  if (!isGoogleSignInNativeEnabled()) {
    return stub;
  }
  if (!cached) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
  }
  return cached;
}
