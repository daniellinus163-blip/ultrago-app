import Constants, { ExecutionEnvironment } from 'expo-constants';

/** True when running inside the Expo Go store client (QR scan). */
export function isExpoGoClient(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** True when a custom dev/production build includes optional native modules. */
export function isGoogleSignInNativeEnabled(): boolean {
  return process.env.EXPO_PUBLIC_GOOGLE_SIGNIN_NATIVE === '1' && !isExpoGoClient();
}

/** True when real push/local notifications should run (dev build or EAS, not Expo Go stub). */
export function isPushNotificationsNativeEnabled(): boolean {
  return process.env.EXPO_PUBLIC_PUSH_NATIVE === '1' && !isExpoGoClient();
}
