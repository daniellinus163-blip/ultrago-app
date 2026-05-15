import { doc, GeoPoint, serverTimestamp, updateDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { LatLng } from '../../types/geo';
import { getDb } from '../firebase/firestore';

/** Throttled driver GPS writes so the rider map stays live without spamming Firestore. */
export async function updateDriverRideLocation(rideId: string, coords: LatLng): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.rides, rideId), {
    driverLocation: new GeoPoint(coords.latitude, coords.longitude),
    driverLocationUpdatedAt: serverTimestamp(),
  });
}
