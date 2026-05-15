import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import { getDb } from '../firebase/firestore';

/** Persists post-trip star rating (Phase 3). */
export async function submitRiderRating(rideId: string, stars: number): Promise<void> {
  const clamped = Math.min(5, Math.max(1, Math.round(stars)));
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.rides, rideId), {
    riderRating: clamped,
    ratedAt: serverTimestamp(),
  });
}
