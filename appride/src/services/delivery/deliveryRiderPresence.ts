import { doc, GeoPoint, serverTimestamp, setDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { LatLng } from '../../types/geo';
import { writePartnerLiveLocation } from '../location/partnerRealtimeLocation';
import { getDb } from '../firebase/firestore';

export async function setDeliveryRiderOnline(uid: string, coords: LatLng): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.deliveryRiders, uid),
    {
      uid,
      appRole: 'delivery_rider',
      isOnline: true,
      location: new GeoPoint(coords.latitude, coords.longitude),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function setDeliveryRiderOffline(uid: string): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.deliveryRiders, uid),
    {
      uid,
      isOnline: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateDeliveryRiderLocation(uid: string, coords: LatLng): Promise<void> {
  await writePartnerLiveLocation(COLLECTIONS.deliveryRiders, uid, coords);
}
