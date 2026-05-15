import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { FoodOrder, FoodOrderStatus } from '../../types/food';
import { getDb } from '../firebase/firestore';

const OPEN_STATUSES: FoodOrderStatus[] = ['received', 'preparing', 'out_for_delivery'];

function mapDocToFoodOrder(id: string, raw: Record<string, unknown>): FoodOrder {
  return {
    id,
    placedAt: typeof raw.placedAt === 'number' ? raw.placedAt : Date.now(),
    lines: Array.isArray(raw.lines) ? (raw.lines as FoodOrder['lines']) : [],
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : 0,
    deliveryFee: typeof raw.deliveryFee === 'number' ? raw.deliveryFee : 0,
    status: (raw.status as FoodOrderStatus) ?? 'received',
    customerId: raw.customerId != null ? String(raw.customerId) : undefined,
    deliveryRiderId: raw.deliveryRiderId != null ? String(raw.deliveryRiderId) : null,
    customerDisplayName: raw.customerDisplayName != null ? String(raw.customerDisplayName) : undefined,
    deliveryAddressLabel: raw.deliveryAddressLabel != null ? String(raw.deliveryAddressLabel) : undefined,
    riderMarkedDeliveredAt:
      typeof raw.riderMarkedDeliveredAt === 'number' ? raw.riderMarkedDeliveredAt : undefined,
    customerConfirmedDelivery: raw.customerConfirmedDelivery === true,
  };
}

/**
 * Live food orders for delivery riders (Phase 4) — no device-local mock queue.
 */
export function subscribeOpenFoodOrdersForDelivery(onChange: (orders: FoodOrder[]) => void): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.foodOrders), where('status', 'in', OPEN_STATUSES));
  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs
        .map((d) => mapDocToFoodOrder(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.placedAt - a.placedAt);
      onChange(orders);
    },
    () => onChange([]),
  );
}
