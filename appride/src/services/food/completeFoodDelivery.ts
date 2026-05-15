import { doc, getDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import { getDb } from '../firebase/firestore';
import {
  creditPartnerEarningOnCompletion,
  estimateFoodDeliveryPartnerEarnings,
} from '../partnerWallet/creditPartnerEarning';
import { updateFoodOrderInFirestore } from './foodOrdersFirestore';

/**
 * Rider marks delivery complete (customer must confirm to release earnings).
 */
export async function markFoodOrderDeliveredByRider(orderId: string): Promise<void> {
  await updateFoodOrderInFirestore(orderId, {
    status: 'delivered',
    riderMarkedDeliveredAt: Date.now(),
  });
}

/**
 * Customer confirms receipt — credits delivery rider if not already credited.
 */
export async function confirmFoodDeliveryByCustomer(orderId: string): Promise<void> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.foodOrders, orderId));
  if (!snap.exists()) {
    throw new Error('Order not found.');
  }
  const data = snap.data() as Record<string, unknown>;
  const riderId = data.deliveryRiderId != null ? String(data.deliveryRiderId) : '';
  const deliveryFee = typeof data.deliveryFee === 'number' ? data.deliveryFee : 0;
  const status = String(data.status ?? '');

  if (status !== 'delivered') {
    throw new Error('Wait until your rider marks the order as delivered.');
  }

  await updateFoodOrderInFirestore(orderId, {
    customerConfirmedDelivery: true,
    customerConfirmedAt: Date.now(),
  });

  if (riderId) {
    await creditPartnerEarningOnCompletion({
      partnerUid: riderId,
      amount: estimateFoodDeliveryPartnerEarnings(deliveryFee),
      context: 'food_delivered',
      reference: orderId,
      metadata: { orderId, deliveryFee },
    });
  }
}
