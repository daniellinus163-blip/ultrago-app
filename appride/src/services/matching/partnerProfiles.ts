import type { PartnerPublicProfile } from '../../types/partner';
import type { UserProfile } from '../../types/user';
import { getUserProfile } from '../users/userProfile';

const cache = new Map<string, PartnerPublicProfile>();

function vehicleLabelFromProfile(profile: UserProfile): string | null {
  const d = profile.driverProfile;
  const r = profile.deliveryRiderProfile;
  const stub = d ?? r;
  if (!stub) {
    return null;
  }
  const parts = [stub.vehicleMake, stub.vehicleModel, stub.vehiclePlate].filter(Boolean) as string[];
  if (parts.length) {
    return parts.join(' · ');
  }
  return stub.vehicleNote?.trim() || null;
}

function ratingFromProfile(profile: UserProfile): { ratingAvg: number; ratingCount: number } {
  const stub = profile.driverProfile ?? profile.deliveryRiderProfile;
  const ratingAvg = typeof stub?.ratingAvg === 'number' ? stub.ratingAvg : 5;
  const ratingCount = typeof stub?.ratingCount === 'number' ? stub.ratingCount : 0;
  return { ratingAvg, ratingCount };
}

export function mapUserToPartnerProfile(profile: UserProfile): PartnerPublicProfile | null {
  const appRole = profile.appRole;
  if (appRole !== 'driver' && appRole !== 'delivery_rider') {
    return null;
  }
  if (appRole === 'driver' && !profile.driverModeEnabled) {
    return null;
  }
  const { ratingAvg, ratingCount } = ratingFromProfile(profile);
  return {
    uid: profile.uid,
    displayName: profile.displayName?.trim() || 'Partner',
    photoUrl: profile.photoUrl ?? null,
    phoneNumber: profile.phoneNumber?.trim() || null,
    ratingAvg,
    ratingCount,
    vehicleLabel: vehicleLabelFromProfile(profile),
    appRole,
  };
}

export async function fetchPartnerPublicProfile(uid: string): Promise<PartnerPublicProfile | null> {
  const cached = cache.get(uid);
  if (cached) {
    return cached;
  }
  const profile = await getUserProfile(uid);
  if (!profile) {
    return null;
  }
  const mapped = mapUserToPartnerProfile(profile);
  if (mapped) {
    cache.set(uid, mapped);
  }
  return mapped;
}

export function primePartnerProfileCache(profile: PartnerPublicProfile): void {
  cache.set(profile.uid, profile);
}

export function clearPartnerProfileCache(): void {
  cache.clear();
}
