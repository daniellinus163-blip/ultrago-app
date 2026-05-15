import type { GeoPoint } from './geo';

/**
 * Ride lifecycle for the MVP. Later phases wire each transition to Firestore + FCM.
 */
export type RideStatus =
  | 'requested'
  | 'searching'
  | 'driver_accepted'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * Shape mirrors what we store in Firestore (`rides` collection) so listeners stay simple.
 */
export type Ride = {
  id: string;
  userId: string;
  driverId?: string;
  pickupLocation: GeoPoint;
  destination: GeoPoint;
  status: RideStatus;
  fare?: number;
  pickupLabel?: string;
  destinationLabel?: string;
  rideCategory?: string;
  /** 1–5 after rider submits rating (Phase 3). */
  riderRating?: number;
  /** Firestore `serverTimestamp` result — matches the brief's `timestamp` field. */
  timestamp?: unknown;
  createdAt?: unknown;
  /** Live driver position — updated for the rider map in later phases. */
  driverLocation?: GeoPoint;
  /** Server time of last driverLocation write (Phase 7). */
  driverLocationUpdatedAt?: unknown;
};
