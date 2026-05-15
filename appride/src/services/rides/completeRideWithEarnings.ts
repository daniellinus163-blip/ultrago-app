import { doc, getDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import { getDb } from '../firebase/firestore';
import {
  creditPartnerEarningOnCompletion,
  estimateRidePartnerEarnings,
} from '../partnerWallet/creditPartnerEarning';
import { updateRideStatus } from './rideLifecycle';

/**
 * Phase 5 — mark ride completed and credit driver wallet once (idempotent).
 */
export async function completeRideWithPartnerEarnings(rideId: string): Promise<void> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.rides, rideId));
  if (!snap.exists()) {
    throw new Error('Ride not found.');
  }
  const data = snap.data();
  const driverId = data?.driverId != null ? String(data.driverId) : '';
  const fare = typeof data?.fare === 'number' ? data.fare : Number(data?.fare) || 0;

  await updateRideStatus(rideId, 'completed');

  if (driverId) {
    await creditPartnerEarningOnCompletion({
      partnerUid: driverId,
      amount: estimateRidePartnerEarnings(fare),
      context: 'ride_completed',
      reference: rideId,
      metadata: { rideId, fare },
    });
  }
}
