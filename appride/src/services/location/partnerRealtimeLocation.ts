import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { LatLng } from '../../types/geo';
import { getDb } from '../firebase/firestore';

/**
 * Phase 7 — writes live partner GPS to Firestore for matching & rider maps.
 * Used by `usePartnerLocationHeartbeat` on driver / delivery tabs.
 */
export async function writePartnerLiveLocation(
  collectionName: typeof COLLECTIONS.drivers | typeof COLLECTIONS.deliveryRiders,
  uid: string,
  coords: LatLng,
  extra?: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, collectionName, uid),
    {
      uid,
      location: { latitude: coords.latitude, longitude: coords.longitude },
      updatedAt: serverTimestamp(),
      ...extra,
    },
    { merge: true },
  );
}
