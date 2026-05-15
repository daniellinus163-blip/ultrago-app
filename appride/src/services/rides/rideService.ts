import { addDoc, collection, GeoPoint, serverTimestamp } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { GeoPoint as PlainGeo } from '../../types/geo';
import { fanOutRideRequestNotifications } from '../notifications/partnerRequestFanout';
import { getDb } from '../firebase/firestore';

export type CreateRideInput = {
  riderId: string;
  pickup: PlainGeo;
  destination: PlainGeo;
  fareEstimate: number;
  rideCategory?: string;
  pickupLabel?: string;
  destinationLabel?: string;
  customerDisplayName?: string;
  /** Phase 2 — Firestore `paymentMethods` doc id (charge runs server-side later). */
  paymentMethodId?: string;
};

/**
 * Writes a new ride request. Nearby online drivers accept via Driver desk (Phase 4).
 */
export async function createRideRequest(input: CreateRideInput): Promise<string> {
  const db = getDb();
  const ref = await addDoc(collection(db, COLLECTIONS.rides), {
    userId: input.riderId,
    pickupLocation: new GeoPoint(input.pickup.latitude, input.pickup.longitude),
    destination: new GeoPoint(input.destination.latitude, input.destination.longitude),
    status: 'searching',
    fare: input.fareEstimate,
    rideCategory: input.rideCategory ?? 'economy',
    pickupLabel: input.pickupLabel ?? null,
    destinationLabel: input.destinationLabel ?? null,
    paymentMethodId: input.paymentMethodId ?? null,
    timestamp: serverTimestamp(),
  });
  void fanOutRideRequestNotifications({
    rideId: ref.id,
    customerId: input.riderId,
    customerDisplayName: input.customerDisplayName,
    pickup: input.pickup,
    pickupLabel: input.pickupLabel,
    rideCategory: input.rideCategory,
    fare: input.fareEstimate,
  }).catch(() => {
    /* Fan-out is best-effort when offline */
  });
  return ref.id;
}
