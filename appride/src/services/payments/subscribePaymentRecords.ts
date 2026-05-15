import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import { getDb } from '../firebase/firestore';
import type { PaymentRecordRow } from '../../types/payment';
import { createdAtToMs } from '../../types/payment';

function mapDoc(id: string, data: Record<string, unknown>): PaymentRecordRow {
  const status = (data.status as PaymentRecordRow['status']) ?? 'pending';
  return {
    id,
    uid: String(data.uid ?? ''),
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? 'USD'),
    provider: String(data.provider ?? 'demo'),
    status,
    reference: String(data.reference ?? ''),
    context: String(data.context ?? ''),
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAtMs: createdAtToMs(data.createdAt as Timestamp | undefined),
  };
}

/**
 * Live listener for the current user's gateway payment audit rows.
 * Uses a single-field `uid` filter (no composite index required).
 */
export function subscribePaymentRecords(
  uid: string,
  onRows: (rows: PaymentRecordRow[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.paymentRecords), where('uid', '==', uid), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
      rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onRows(rows);
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    },
  );
}
