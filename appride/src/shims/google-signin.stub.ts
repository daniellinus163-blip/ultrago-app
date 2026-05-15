/**
 * Stub for `@react-native-google-signin/google-signin` in Expo Go.
 * The real package calls TurboModuleRegistry.getEnforcing('RNGoogleSignin') at load time,
 * which crashes Expo Go before any screen renders.
 */
export const statusCodes = {
  SIGN_IN_CANCELLED: '-5',
  IN_PROGRESS: '-1',
  PLAY_SERVICES_NOT_AVAILABLE: '2',
} as const;

export type GoogleSignInResponse =
  | { type: 'success'; data: { idToken: string | null; user?: unknown } }
  | { type: 'cancelled'; data: null };

export const GoogleSignin = {
  configure(_options?: Record<string, unknown>): void {},
  async hasPlayServices(_options?: { showPlayServicesUpdateDialog?: boolean }): Promise<boolean> {
    return true;
  },
  async signIn(): Promise<GoogleSignInResponse> {
    return { type: 'cancelled', data: null };
  },
  async signOut(): Promise<void> {},
  async getTokens(): Promise<{ idToken: string | null }> {
    return { idToken: null };
  },
};

export type GoogleSigninButtonProps = Record<string, unknown>;
export function GoogleSigninButton(): null {
  return null;
}
