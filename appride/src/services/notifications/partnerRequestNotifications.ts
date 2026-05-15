import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type {
  PartnerRequestKind,
  PartnerRequestNotification,
  PartnerRequestNotificationStatus,
} from '../../types/partnerRequestNotification';
import { getDb } from '../firebase/firestore';
import { acceptRideAsDriver } from '../rides/driverRideActions';
import { updateFoodOrderInFirestore } from '../food/foodOrdersFirestore';

function createdAtToMs(v: Timestamp | { seconds: number } | undefined | null): number {
  if (!v) {
    return Date.now();
  }
  if ('toMillis' in v && typeof v.toMillis === 'function') {
    return v.toMillis();
  }
  return ('seconds' in v ? v.seconds : 0) * 1000;
}

function mapNotification(id: string, raw: Record<string, unknown>): PartnerRequestNotification {
  const loc = raw.customerLocation as { latitude?: number; longitude?: number } | undefined;
  return {
    id,
    partnerUid: String(raw.partnerUid ?? ''),
    kind: (raw.kind as PartnerRequestKind) ?? 'ride',
    referenceId: String(raw.referenceId ?? ''),
    status: (raw.status as PartnerRequestNotificationStatus) ?? 'pending',
    customerId: String(raw.customerId ?? ''),
    customerDisplayName: raw.customerDisplayName != null ? String(raw.customerDisplayName) : undefined,
    customerLocation: {
      latitude: typeof loc?.latitude === 'number' ? loc.latitude : 0,
      longitude: typeof loc?.longitude === 'number' ? loc.longitude : 0,
    },
    locationLabel: raw.locationLabel != null ? String(raw.locationLabel) : undefined,
    orderTypeLabel: String(raw.orderTypeLabel ?? ''),
    estimatedEarnings: typeof raw.estimatedEarnings === 'number' ? raw.estimatedEarnings : 0,
    currency: String(raw.currency ?? 'USD'),
    createdAtMs: createdAtToMs(raw.createdAt as Timestamp),
  };
}

export function subscribePartnerRequestNotifications(
  partnerUid: string,
  onChange: (rows: PartnerRequestNotification[]) => void,
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.partnerRequestNotifications),
    where('partnerUid', '==', partnerUid),
    where('status', '==', 'pending'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => mapNotification(d.id, d.data() as Record<string, unknown>));
      rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onChange(rows);
    },
    () => onChange([]),
  );
}

export async function rejectPartnerRequest(notificationId: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.partnerRequestNotifications, notificationId), {
    status: 'rejected',
  });
}

async function expirePendingNotificationsForReference(
  referenceId: string,
  exceptNotificationId?: string,
): Promise<void> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.partnerRequestNotifications),
      where('referenceId', '==', referenceId),
      where('status', '==', 'pending'),
    ),
  );
  await Promise.all(
    snap.docs
      .filter((d) => d.id !== exceptNotificationId)
      .map((d) =>
        updateDoc(doc(db, COLLECTIONS.partnerRequestNotifications, d.id), { status: 'expired' }),
      ),
  );
}

export async function acceptRidePartnerRequest(
  notification: PartnerRequestNotification,
  driverId: string,
): Promise<void> {
  await acceptRideAsDriver(notification.referenceId, driverId);
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.partnerRequestNotifications, notification.id), {
    status: 'accepted',
  });
  await expirePendingNotificationsForReference(notification.referenceId, notification.id);
}

export async function acceptFoodDeliveryPartnerRequest(
  notification: PartnerRequestNotification,
  riderId: string,
): Promise<void> {
  const db = getDb();
  const orderRef = doc(db, COLLECTIONS.foodOrders, notification.referenceId);
  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error('This food order no longer exists.');
    }
    const data = orderSnap.data();
    if (data?.deliveryRiderId && data.deliveryRiderId !== riderId) {
      throw new Error('Another rider already accepted this delivery.');
    }
    if (data?.status === 'delivered') {
      throw new Error('This order is already completed.');
    }
    tx.update(orderRef, {
      deliveryRiderId: riderId,
      status: 'out_for_delivery',
    });
  });
  await updateDoc(doc(db, COLLECTIONS.partnerRequestNotifications, notification.id), {
    status: 'accepted',
  });
  await expirePendingNotificationsForReference(notification.referenceId, notification.id);
}
