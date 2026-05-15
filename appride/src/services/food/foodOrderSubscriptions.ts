import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { FoodOrder, FoodOrderStatus } from '../../types/food';
import { getDb } from '../firebase/firestore';

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
    customerConfirmedAt:
      typeof raw.customerConfirmedAt === 'number' ? raw.customerConfirmedAt : undefined,
  };
}

/** Live order updates for customer tracking (Phase 4 delivery matching). */
export function subscribeFoodOrder(orderId: string, onChange: (order: FoodOrder | null) => void): Unsubscribe {
  const db = getDb();
  return onSnapshot(doc(db, COLLECTIONS.foodOrders, orderId), (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    onChange(mapDocToFoodOrder(snap.id, snap.data() as Record<string, unknown>));
  });
}
