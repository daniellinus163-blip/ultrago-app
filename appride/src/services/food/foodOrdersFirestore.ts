import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { FoodOrder } from '../../types/food';
import type { LatLng } from '../../types/geo';
import { fanOutFoodDeliveryRequestNotifications } from '../notifications/partnerRequestFanout';
import { getDb } from '../firebase/firestore';

/** Mirror local food order to Firestore for dashboards / delivery riders. */
export async function syncFoodOrderToFirestore(
  order: FoodOrder,
  customerId: string,
  payment?: {
    paymentMethodId?: string;
    total?: number;
    customerDisplayName?: string;
    deliveryAddressLabel?: string;
    pickup?: LatLng | null;
  },
): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.foodOrders, order.id),
    {
      ...order,
      customerId,
      customerDisplayName: payment?.customerDisplayName ?? null,
      deliveryAddressLabel: payment?.deliveryAddressLabel ?? null,
      paymentMethodId: payment?.paymentMethodId ?? null,
      orderTotal: payment?.total ?? order.subtotal + order.deliveryFee,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  void fanOutFoodDeliveryRequestNotifications({
    orderId: order.id,
    customerId,
    customerDisplayName: payment?.customerDisplayName,
    deliveryAddressLabel: payment?.deliveryAddressLabel,
    deliveryFee: order.deliveryFee,
    pickup: payment?.pickup ?? null,
  }).catch(() => {});
}

export async function updateFoodOrderInFirestore(orderId: string, patch: Partial<FoodOrder>): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.foodOrders, orderId),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
