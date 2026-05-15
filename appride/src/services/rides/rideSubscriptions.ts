import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { GeoPoint } from '../../types/geo';
import type { Ride, RideStatus } from '../../types/ride';
import { getDb } from '../firebase/firestore';

/** Firestore GeoPoint and plain objects both expose latitude/longitude. */
function asGeoPoint(value: unknown): GeoPoint {
  if (value && typeof value === 'object' && 'latitude' in value && 'longitude' in value) {
    const o = value as { latitude: number; longitude: number };
    return { latitude: o.latitude, longitude: o.longitude };
  }
  return { latitude: 0, longitude: 0 };
}

export function mapDocToRide(id: string, raw: Record<string, unknown>): Ride {
  return {
    id,
    userId: String(raw.userId ?? ''),
    driverId: raw.driverId != null ? String(raw.driverId) : undefined,
    pickupLocation: asGeoPoint(raw.pickupLocation),
    destination: asGeoPoint(raw.destination),
    status: (raw.status as RideStatus) ?? 'requested',
    fare: typeof raw.fare === 'number' ? raw.fare : undefined,
    pickupLabel: raw.pickupLabel != null ? String(raw.pickupLabel) : undefined,
    destinationLabel: raw.destinationLabel != null ? String(raw.destinationLabel) : undefined,
    rideCategory: raw.rideCategory != null ? String(raw.rideCategory) : undefined,
    riderRating: typeof raw.riderRating === 'number' ? raw.riderRating : undefined,
    timestamp: raw.timestamp,
    createdAt: raw.createdAt,
    driverLocation: raw.driverLocation != null ? asGeoPoint(raw.driverLocation) : undefined,
    driverLocationUpdatedAt: raw.driverLocationUpdatedAt,
  };
}

/**
 * Real-time ride document listener (Phase 9). Maps Firestore types into our `Ride` shape.
 */
export function subscribeToRide(
  rideId: string,
  onChange: (ride: Ride | null) => void,
): Unsubscribe {
  const db = getDb();
  return onSnapshot(doc(db, COLLECTIONS.rides, rideId), (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    onChange(mapDocToRide(snap.id, snap.data() as Record<string, unknown>));
  });
}
