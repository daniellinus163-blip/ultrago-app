import { collection, doc, getDocs, query, runTransaction, updateDoc, where } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import { getDb } from '../firebase/firestore';

async function expireRideRequestNotifications(rideId: string): Promise<void> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.partnerRequestNotifications),
      where('referenceId', '==', rideId),
      where('status', '==', 'pending'),
    ),
  );
  await Promise.all(
    snap.docs.map((d) =>
      updateDoc(doc(db, COLLECTIONS.partnerRequestNotifications, d.id), { status: 'expired' }),
    ),
  );
}

/** Driver accepts a pending ride — only if still `searching` (Phase 4–5). */
export async function acceptRideAsDriver(rideId: string, driverId: string): Promise<void> {
  const db = getDb();
  const rideRef = doc(db, COLLECTIONS.rides, rideId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(rideRef);
    if (!snap.exists()) {
      throw new Error('This ride request no longer exists.');
    }
    const status = snap.data()?.status;
    if (status !== 'searching' && status !== 'requested') {
      throw new Error('Another driver already accepted this ride.');
    }
    tx.update(rideRef, {
      driverId,
      status: 'driver_accepted',
    });
  });
  await expireRideRequestNotifications(rideId);
}
