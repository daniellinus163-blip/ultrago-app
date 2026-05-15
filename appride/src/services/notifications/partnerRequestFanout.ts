import {
  collection,
  doc,
  GeoPoint,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { LatLng } from '../../types/geo';
import { distanceKm } from '../../utils/fareEstimate';
import { OPEN_RIDE_MATCH_RADIUS_KM } from '../../utils/rideMatchingGeo';
import { getDb } from '../firebase/firestore';
import {
  estimateFoodDeliveryPartnerEarnings,
  estimateRidePartnerEarnings,
} from '../partnerWallet/creditPartnerEarning';

const MAX_FANOUT = 12;

function readPresenceLocation(raw: Record<string, unknown>): LatLng | null {
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

async function pickOnlinePartnersNear(
  collectionName: typeof COLLECTIONS.drivers | typeof COLLECTIONS.deliveryRiders,
  center: LatLng,
  radiusKm: number,
): Promise<string[]> {
  const db = getDb();
  const snap = await getDocs(query(collection(db, collectionName), where('isOnline', '==', true)));
  const ranked: { uid: string; km: number }[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const coord = readPresenceLocation(data);
    if (!coord) {
      continue;
    }
    const km = distanceKm(center, coord);
    if (km <= radiusKm) {
      ranked.push({ uid: d.id, km });
    }
  }
  ranked.sort((a, b) => a.km - b.km);
  return ranked.slice(0, MAX_FANOUT).map((r) => r.uid);
}

async function writeNotificationBatch(
  partnerUids: string[],
  payload: Omit<Record<string, unknown>, 'partnerUid' | 'createdAt'>,
): Promise<void> {
  if (!partnerUids.length) {
    return;
  }
  const db = getDb();
  const batch = writeBatch(db);
  for (const partnerUid of partnerUids) {
    const ref = doc(collection(db, COLLECTIONS.partnerRequestNotifications));
    batch.set(ref, {
      ...payload,
      partnerUid,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function fanOutRideRequestNotifications(params: {
  rideId: string;
  customerId: string;
  customerDisplayName?: string;
  pickup: LatLng;
  pickupLabel?: string;
  rideCategory?: string;
  fare: number;
}): Promise<void> {
  const partnerUids = await pickOnlinePartnersNear(
    COLLECTIONS.drivers,
    params.pickup,
    OPEN_RIDE_MATCH_RADIUS_KM,
  );
  const estimatedEarnings = estimateRidePartnerEarnings(params.fare);
  await writeNotificationBatch(partnerUids, {
    kind: 'ride',
    referenceId: params.rideId,
    customerId: params.customerId,
    customerDisplayName: params.customerDisplayName ?? null,
    customerLocation: new GeoPoint(params.pickup.latitude, params.pickup.longitude),
    locationLabel: params.pickupLabel ?? null,
    orderTypeLabel: params.rideCategory ?? 'ride',
    estimatedEarnings,
    currency: 'USD',
  });
}

export async function fanOutFoodDeliveryRequestNotifications(params: {
  orderId: string;
  customerId: string;
  customerDisplayName?: string;
  deliveryAddressLabel?: string;
  deliveryFee: number;
  pickup?: LatLng | null;
}): Promise<void> {
  let partnerUids: string[];
  if (params.pickup) {
    partnerUids = await pickOnlinePartnersNear(
      COLLECTIONS.deliveryRiders,
      params.pickup,
      OPEN_RIDE_MATCH_RADIUS_KM,
    );
  } else {
    const db = getDb();
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.deliveryRiders), where('isOnline', '==', true)),
    );
    partnerUids = snap.docs.slice(0, MAX_FANOUT).map((d) => d.id);
  }

  const estimatedEarnings = estimateFoodDeliveryPartnerEarnings(params.deliveryFee);
  const center = params.pickup ?? { latitude: 0, longitude: 0 };

  await writeNotificationBatch(partnerUids, {
    kind: 'food_delivery',
    referenceId: params.orderId,
    customerId: params.customerId,
    customerDisplayName: params.customerDisplayName ?? null,
    customerLocation: new GeoPoint(center.latitude, center.longitude),
    locationLabel: params.deliveryAddressLabel ?? null,
    orderTypeLabel: 'food_delivery',
    estimatedEarnings,
    currency: 'USD',
  });
}
