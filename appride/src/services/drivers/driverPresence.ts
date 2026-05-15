import { doc, GeoPoint, serverTimestamp, setDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { LatLng } from '../../types/geo';
import { writePartnerLiveLocation } from '../location/partnerRealtimeLocation';
import { getDb } from '../firebase/firestore';

/**
 * `drivers/{uid}` holds availability for matching. Real apps also validate
 * documents, insurance, etc. — this MVP keeps the shape small for learning.
 */
export async function setDriverOnline(
  uid: string,
  coords: LatLng,
  meta?: { displayName?: string; phoneNumber?: string },
): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.drivers, uid),
    {
      uid,
      appRole: 'driver',
      isOnline: true,
      displayName: meta?.displayName ?? null,
      phoneNumber: meta?.phoneNumber ?? null,
      location: new GeoPoint(coords.latitude, coords.longitude),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateDriverPresenceLocation(uid: string, coords: LatLng): Promise<void> {
  await writePartnerLiveLocation(COLLECTIONS.drivers, uid, coords);
}

export async function setDriverOffline(uid: string): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.drivers, uid),
    {
      uid,
      isOnline: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
