/**
 * Phone authentication with the Firebase **web** SDK inside Expo is limited:
 * on native builds you typically need Firebase's native phone flow or a custom URL scheme.
 *
 * This module is a **learning scaffold** — wire it in Phase 2+ once you choose:
 * - Expo dev client + native Firebase phone, or
 * - Email-only MVP (simplest for class demos).
 *
 * See: https://firebase.google.com/docs/auth/web/phone-auth
 */

import type { UserCredential } from 'firebase/auth';

export type PhoneAuthSession = {
  verificationId: string;
  /** Called after user receives SMS and types the code. */
  confirm: (code: string) => Promise<UserCredential>;
};

export async function requestPhoneOtp(phoneE164: string): Promise<PhoneAuthSession> {
  void phoneE164;
  throw new Error(
    'Phone auth is not wired in this MVP scaffold. Use email/password or extend this file with your chosen Expo + Firebase phone strategy.',
  );
}
