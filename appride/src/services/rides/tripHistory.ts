import { collection, getDocs, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { Ride } from '../../types/ride';
import { getDb } from '../firebase/firestore';
import { mapDocToRide } from './rideSubscriptions';

function timestampToMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'number') {
    return value;
  }
  return 0;
}

function sortRidesNewestFirst(items: Ride[]): Ride[] {
  return [...items].sort((a, b) => {
    const ta = timestampToMillis(a.timestamp ?? a.createdAt);
    const tb = timestampToMillis(b.timestamp ?? b.createdAt);
    return tb - ta;
  });
}

/** One-time fetch (legacy). Prefer `subscribeRideHistory`. */
export async function fetchTripsForUser(userId: string, asDriver = false): Promise<Ride[]> {
  const db = getDb();
  const field = asDriver ? 'driverId' : 'userId';
  const q = query(collection(db, COLLECTIONS.rides), where(field, '==', userId));
  const snap = await getDocs(q);
  return sortRidesNewestFirst(
    snap.docs.map((d) => mapDocToRide(d.id, d.data() as Record<string, unknown>)),
  );
}

/**
 * Phase 7 — realtime ride history for riders or drivers (no fake data).
 */
export function subscribeRideHistory(
  uid: string,
  mode: 'rider' | 'driver',
  onChange: (rides: Ride[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const db = getDb();
  const field = mode === 'driver' ? 'driverId' : 'userId';
  const q = query(collection(db, COLLECTIONS.rides), where(field, '==', uid));

  return onSnapshot(
    q,
    (snap) => {
      const rows = sortRidesNewestFirst(
        snap.docs.map((d) => mapDocToRide(d.id, d.data() as Record<string, unknown>)),
      );
      onChange(rows);
    },
    (err) => onError?.(err.message),
  );
}
