import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { isGoogleSignInNativeEnabled } from '../../lib/expoRuntime';

import { getFirebaseAuth } from '../firebase/auth';

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function sendPasswordResetToEmail(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email.trim());
}

/** Email/password accounts only. Google-only users should use provider security settings. */
export async function changePasswordWithCurrent(currentPassword: string, newPassword: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('Signed-in account has no email — password change is unavailable.');
  }
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

export async function logout(): Promise<void> {
  if (isGoogleSignInNativeEnabled()) {
    try {
      const { signOutGoogle } = await import('./googleSignIn');
      await signOutGoogle();
    } catch {
      /* Google module unavailable / user not signed in with Google */
    }
  }
  const auth = getFirebaseAuth();
  await signOut(auth);
}
