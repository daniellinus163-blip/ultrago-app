import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { FoodOrder, FoodOrderStatus } from '../../types/food';
import { getDb } from '../firebase/firestore';

export type DeliveryHistoryEntry = FoodOrder & {
  orderTotal?: number;
};

function mapDoc(id: string, raw: Record<string, unknown>): DeliveryHistoryEntry {
  return {
    id,
    placedAt: typeof raw.placedAt === 'number' ? raw.placedAt : Date.now(),
    lines: Array.isArray(raw.lines) ? (raw.lines as DeliveryHistoryEntry['lines']) : [],
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : 0,
    deliveryFee: typeof raw.deliveryFee === 'number' ? raw.deliveryFee : 0,
    status: (raw.status as FoodOrderStatus) ?? 'received',
    customerId: raw.customerId != null ? String(raw.customerId) : undefined,
    deliveryRiderId: raw.deliveryRiderId != null ? String(raw.deliveryRiderId) : null,
    customerDisplayName: raw.customerDisplayName != null ? String(raw.customerDisplayName) : undefined,
    deliveryAddressLabel: raw.deliveryAddressLabel != null ? String(raw.deliveryAddressLabel) : undefined,
    customerConfirmedDelivery: raw.customerConfirmedDelivery === true,
    orderTotal: typeof raw.orderTotal === 'number' ? raw.orderTotal : undefined,
  };
}

function sortNewest(rows: DeliveryHistoryEntry[]): DeliveryHistoryEntry[] {
  return [...rows].sort((a, b) => b.placedAt - a.placedAt);
}

/** Customer food order history — realtime. */
export function subscribeCustomerFoodHistory(
  customerId: string,
  onChange: (orders: DeliveryHistoryEntry[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.foodOrders), where('customerId', '==', customerId));
  return onSnapshot(
    q,
    (snap) => {
      onChange(sortNewest(snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))));
    },
    (err) => onError?.(err.message),
  );
}

/** Delivery rider completed / assigned orders — realtime. */
export function subscribeRiderDeliveryHistory(
  riderId: string,
  onChange: (orders: DeliveryHistoryEntry[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.foodOrders), where('deliveryRiderId', '==', riderId));
  return onSnapshot(
    q,
    (snap) => {
      onChange(sortNewest(snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))));
    },
    (err) => onError?.(err.message),
  );
}
