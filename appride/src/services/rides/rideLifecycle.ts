import { doc, updateDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { RideStatus } from '../../types/ride';
import { getDb } from '../firebase/firestore';

/**
 * Single write path for ride status transitions (Phase 9 state machine).
 * Both rider UI listeners and driver actions go through Firestore updates here.
 */
export async function updateRideStatus(
  rideId: string,
  status: RideStatus,
  extra?: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.rides, rideId), {
    status,
    ...(extra ?? {}),
  });
}
