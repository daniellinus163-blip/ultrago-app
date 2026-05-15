import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { LatLng } from '../../types/geo';
import type { NearbyPartner } from '../../types/partner';
import type { AppRole } from '../../types/user';
import { distanceKm } from '../../utils/fareEstimate';
import { getDb } from '../firebase/firestore';

import { fetchPartnerPublicProfile, primePartnerProfileCache } from './partnerProfiles';

function readLocation(raw: Record<string, unknown>): LatLng | null {
  const loc = raw.location;
  if (!loc || typeof loc !== 'object') {
    return null;
  }
  const o = loc as { latitude?: unknown; longitude?: unknown };
  if (typeof o.latitude !== 'number' || typeof o.longitude !== 'number') {
    return null;
  }
  return { latitude: o.latitude, longitude: o.longitude };
}

async function enrichPresenceDocs(
  docs: { id: string; data: Record<string, unknown> }[],
  center: LatLng,
  radiusKm: number,
  roleFilter: AppRole,
): Promise<NearbyPartner[]> {
  const partners: NearbyPartner[] = [];
  for (const d of docs) {
    const role = d.data.appRole as AppRole | undefined;
    if (role && role !== roleFilter) {
      continue;
    }
    const coord = readLocation(d.data);
    if (!coord) {
      continue;
    }
    const km = distanceKm(center, coord);
    if (km > radiusKm) {
      continue;
    }
    const profile = await fetchPartnerPublicProfile(d.id);
    if (!profile || profile.appRole !== roleFilter) {
      continue;
    }
    primePartnerProfileCache(profile);
    partners.push({ ...profile, coordinate: coord, distanceKm: km });
  }
  partners.sort((a, b) => a.distanceKm - b.distanceKm);
  return partners;
}

function subscribeOnlinePresence(
  collectionName: typeof COLLECTIONS.drivers | typeof COLLECTIONS.deliveryRiders,
  center: LatLng | null,
  radiusKm: number,
  roleFilter: AppRole,
  onChange: (partners: NearbyPartner[]) => void,
): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, collectionName), where('isOnline', '==', true));
  let cancelled = false;

  return onSnapshot(
    q,
    (snap) => {
      if (!center) {
        onChange([]);
        return;
      }
      const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
      void enrichPresenceDocs(docs, center, radiusKm, roleFilter).then((partners) => {
        if (!cancelled) {
          onChange(partners);
        }
      });
    },
    () => onChange([]),
  );
}

/** Real online drivers from Firebase — authenticated, `appRole: driver`, within radius. */
export function subscribeNearbyDrivers(
  center: LatLng | null,
  radiusKm: number,
  onChange: (drivers: NearbyPartner[]) => void,
): Unsubscribe {
  return subscribeOnlinePresence(COLLECTIONS.drivers, center, radiusKm, 'driver', onChange);
}

/** Real online delivery riders from Firebase within radius. */
export function subscribeNearbyDeliveryRiders(
  center: LatLng | null,
  radiusKm: number,
  onChange: (riders: NearbyPartner[]) => void,
): Unsubscribe {
  return subscribeOnlinePresence(COLLECTIONS.deliveryRiders, center, radiusKm, 'delivery_rider', onChange);
}
