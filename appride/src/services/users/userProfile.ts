import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { AppRole, UserLastKnownLocation, UserProfile } from '../../types/user';
import { getDb } from '../firebase/firestore';

function roleFieldsForAppRole(appRole: AppRole): Pick<UserProfile, 'role' | 'driverModeEnabled'> {
  if (appRole === 'driver') {
    return { role: 'driver', driverModeEnabled: true };
  }
  return { role: 'rider', driverModeEnabled: false };
}

function roleSpecificStubs(appRole: AppRole): Pick<
  UserProfile,
  'customerProfile' | 'driverProfile' | 'deliveryRiderProfile'
> {
  if (appRole === 'customer') {
    return { customerProfile: { version: 1 }, driverProfile: null, deliveryRiderProfile: null };
  }
  if (appRole === 'driver') {
    return { customerProfile: null, driverProfile: { version: 1 }, deliveryRiderProfile: null };
  }
  return { customerProfile: null, driverProfile: null, deliveryRiderProfile: { version: 1 } };
}

/** Phase 1 — all of: persona, phone, and live location must be stored before main app. */
export function isProfileRegistrationComplete(p: UserProfile | null): boolean {
  if (!p?.appRole) {
    return false;
  }
  if (!p.phoneNumber || !String(p.phoneNumber).trim()) {
    return false;
  }
  const loc = p.lastKnownLocation;
  if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number' || Number.isNaN(loc.lat) || Number.isNaN(loc.lng)) {
    return false;
  }
  return true;
}

/**
 * Creates the `users/{uid}` document right after Firebase Auth signup succeeds.
 * Keeping this separate from `emailAuth.ts` keeps auth vs data concerns clear.
 */
export async function createUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<void> {
  const db = getDb();
  const ref = doc(db, COLLECTIONS.users, params.uid);
  await setDoc(ref, {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName,
    role: 'rider',
    driverModeEnabled: false,
    themePreference: 'system',
    locale: 'en',
    securityAlertsEnabled: true,
    notifRidePush: true,
    notifFoodPush: true,
    notifMarketing: false,
    createdAt: serverTimestamp(),
  });
}

/** Full Phase 1 registration in one write (email signup after Auth user exists). */
export async function createUserProfileFromEmailRegistration(params: {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  appRole: AppRole;
  photoUrl?: string | null;
  lastKnownLocation: UserLastKnownLocation;
}): Promise<void> {
  const db = getDb();
  const ref = doc(db, COLLECTIONS.users, params.uid);
  const derived = roleFieldsForAppRole(params.appRole);
  const stubs = roleSpecificStubs(params.appRole);
  await setDoc(ref, {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName.trim(),
    phoneNumber: params.phoneNumber.trim(),
    appRole: params.appRole,
    photoUrl: params.photoUrl ?? null,
    lastKnownLocation: params.lastKnownLocation,
    ...derived,
    ...stubs,
    themePreference: 'system',
    locale: 'en',
    securityAlertsEnabled: true,
    notifRidePush: true,
    notifFoodPush: true,
    notifMarketing: false,
    createdAt: serverTimestamp(),
  });
}

/** Google / OAuth users: merge registration fields without wiping existing prefs. */
export async function mergeRegistrationProfile(params: {
  uid: string;
  phoneNumber: string;
  appRole: AppRole;
  lastKnownLocation: UserLastKnownLocation;
  photoUrl?: string | null;
  displayName?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
}): Promise<void> {
  const db = getDb();
  const derived = roleFieldsForAppRole(params.appRole);
  const stubs = roleSpecificStubs(params.appRole);
  const patch: Record<string, unknown> = {
    uid: params.uid,
    phoneNumber: params.phoneNumber.trim(),
    appRole: params.appRole,
    lastKnownLocation: params.lastKnownLocation,
    ...derived,
    ...stubs,
  };
  if (params.appRole === 'driver' && (params.vehicleMake || params.vehicleModel || params.vehiclePlate)) {
    patch.driverProfile = {
      version: 1,
      vehicleMake: params.vehicleMake?.trim() || undefined,
      vehicleModel: params.vehicleModel?.trim() || undefined,
      vehiclePlate: params.vehiclePlate?.trim() || undefined,
      ratingAvg: 5,
      ratingCount: 0,
    };
  }
  if (params.appRole === 'delivery_rider' && (params.vehicleMake || params.vehicleModel || params.vehiclePlate)) {
    patch.deliveryRiderProfile = {
      version: 1,
      vehicleMake: params.vehicleMake?.trim() || undefined,
      vehicleModel: params.vehicleModel?.trim() || undefined,
      vehiclePlate: params.vehiclePlate?.trim() || undefined,
      ratingAvg: 5,
      ratingCount: 0,
    };
  }
  if (params.photoUrl != null) {
    patch.photoUrl = params.photoUrl;
  }
  if (params.displayName?.trim()) {
    patch.displayName = params.displayName.trim();
  }
  await setDoc(doc(db, COLLECTIONS.users, params.uid), patch, { merge: true });
}

/** Ensures a Firestore profile exists (e.g. after Google sign-in). */
export async function ensureUserProfile(params: { uid: string; email: string; displayName: string }): Promise<void> {
  const db = getDb();
  const ref = doc(db, COLLECTIONS.users, params.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return;
  }
  await createUserProfile(params);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as UserProfile;
}

export async function setDriverModeEnabled(uid: string, enabled: boolean): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.users, uid), { driverModeEnabled: enabled });
}

export async function setUserAppRole(uid: string, appRole: AppRole): Promise<void> {
  const db = getDb();
  const derived = roleFieldsForAppRole(appRole);
  const stubs = roleSpecificStubs(appRole);
  await setDoc(
    doc(db, COLLECTIONS.users, uid),
    { uid, appRole, ...derived, ...stubs },
    { merge: true },
  );
}

export type UserProfilePatch = Partial<
  Pick<
    UserProfile,
    | 'displayName'
    | 'photoUrl'
    | 'themePreference'
    | 'locale'
    | 'securityAlertsEnabled'
    | 'twoFactorHintAcknowledged'
    | 'notifRidePush'
    | 'notifFoodPush'
    | 'notifMarketing'
  >
>;

export async function updateUserProfileFields(uid: string, patch: UserProfilePatch & { displayName?: string }): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.users, uid), patch);
}

/** Stores Expo push token on the user profile for Phase 10 / FCM-style targeting later. */
export async function saveUserPushToken(uid: string, token: string): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.users, uid),
    { uid, pushToken: token },
    { merge: true },
  );
}
