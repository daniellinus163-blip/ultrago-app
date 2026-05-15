import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { LatLng } from '../../types/geo';
import { getDb } from '../firebase/firestore';

export type OnlineDriverPin = {
  id: string;
  coordinate: LatLng;
};

function readDriverLocation(raw: Record<string, unknown>): LatLng | null {
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

/**
 * Live online drivers from `drivers/{uid}` (Phase 7). Caller filters by distance from the rider.
 */
export function subscribeOnlineDrivers(onChange: (drivers: OnlineDriverPin[]) => void): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.drivers), where('isOnline', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const pins: OnlineDriverPin[] = [];
      for (const d of snap.docs) {
        const data = d.data() as Record<string, unknown>;
        const coord = readDriverLocation(data);
        if (coord) {
          pins.push({ id: d.id, coordinate: coord });
        }
      }
      onChange(pins);
    },
    () => {
      onChange([]);
    },
  );
}
