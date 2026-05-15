import { collection, getDocs, query, where, type Timestamp } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import { getDb } from '../firebase/firestore';
import type { PartnerWalletTx } from '../../types/partnerWallet';

function createdAtToMs(v: Timestamp | { seconds: number } | undefined | null): number {
  if (!v) {
    return Date.now();
  }
  if ('toMillis' in v && typeof v.toMillis === 'function') {
    return v.toMillis();
  }
  return ('seconds' in v ? v.seconds : 0) * 1000;
}

function mapDoc(id: string, data: Record<string, unknown>): PartnerWalletTx {
  return {
    id,
    uid: String(data.uid ?? ''),
    kind: (data.kind as PartnerWalletTx['kind']) ?? 'earning_credit',
    context: (data.context as PartnerWalletTx['context']) ?? 'ride_completed',
    status: (data.status as PartnerWalletTx['status']) ?? 'pending',
    amount: typeof data.amount === 'number' ? data.amount : Number(data.amount) || 0,
    currency: String(data.currency ?? 'USD'),
    reference: data.reference != null ? String(data.reference) : null,
    metadata: data.metadata != null && typeof data.metadata === 'object' ? (data.metadata as Record<string, unknown>) : undefined,
    createdAtMs: createdAtToMs(data.createdAt as Timestamp),
  };
}

/** Phase 3: balance is computed from confirmed partner wallet ledger entries. */
export async function fetchDriverEarningsTotal(driverId: string): Promise<number> {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.partnerWalletTx), where('uid', '==', driverId));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
  let total = 0;
  for (const t of rows) {
    if (t.status !== 'confirmed') {
      continue;
    }
    if (t.kind === 'earning_credit') {
      total += t.amount;
    } else {
      total -= t.amount;
    }
  }
  return Math.round(total * 100) / 100;
}
