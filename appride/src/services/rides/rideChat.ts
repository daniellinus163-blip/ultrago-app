import { addDoc, collection, doc, onSnapshot, serverTimestamp, type Unsubscribe } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import { getDb } from '../firebase/firestore';

export type RideChatMessage = {
  id: string;
  uid: string;
  text: string;
  displayName?: string;
  createdAtMs: number;
};

function toMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

export async function sendRideChatMessage(params: {
  rideId: string;
  uid: string;
  displayName?: string;
  text: string;
}): Promise<void> {
  const db = getDb();
  const rideRef = doc(db, COLLECTIONS.rides, params.rideId);
  await addDoc(collection(rideRef, COLLECTIONS.rideChatMessages), {
    uid: params.uid,
    displayName: params.displayName ?? null,
    text: params.text.trim(),
    createdAt: serverTimestamp(),
  });
}

export function subscribeRideChat(rideId: string, onChange: (messages: RideChatMessage[]) => void): Unsubscribe {
  const db = getDb();
  const rideRef = doc(db, COLLECTIONS.rides, rideId);
  return onSnapshot(collection(rideRef, COLLECTIONS.rideChatMessages), (snap) => {
    const rows: RideChatMessage[] = snap.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          uid: String(raw.uid ?? ''),
          text: String(raw.text ?? ''),
          displayName: raw.displayName != null ? String(raw.displayName) : undefined,
          createdAtMs: toMillis(raw.createdAt),
        };
      })
      .sort((a, b) => a.createdAtMs - b.createdAtMs);
    onChange(rows);
  }, () => {
    onChange([]);
  });
}
