import { addDoc, collection, onSnapshot, query, serverTimestamp, type Timestamp, where } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { PartnerWalletTx, PartnerWalletTxContext, PartnerWalletTxKind } from '../../types/partnerWallet';
import { getDb } from '../firebase/firestore';

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
  const createdAtMs = createdAtToMs(data.createdAt as Timestamp);

  return {
    id,
    uid: String(data.uid ?? ''),
    kind: (data.kind as PartnerWalletTxKind) ?? 'earning_credit',
    context: (data.context as PartnerWalletTxContext) ?? 'ride_completed',
    status: (data.status as PartnerWalletTx['status']) ?? 'pending',
    amount: typeof data.amount === 'number' ? data.amount : Number(data.amount) || 0,
    currency: String(data.currency ?? 'USD'),
    reference: data.reference != null ? String(data.reference) : null,
    metadata: data.metadata != null && typeof data.metadata === 'object' ? (data.metadata as Record<string, unknown>) : undefined,
    createdAtMs,
  };
}

function computeBalance(rows: PartnerWalletTx[]): number {
  let balance = 0;
  for (const t of rows) {
    if (t.status !== 'confirmed') {
      continue;
    }
    if (t.kind === 'earning_credit') {
      balance += t.amount;
    } else {
      balance -= t.amount;
    }
  }
  return Math.round(balance * 100) / 100;
}

export function subscribePartnerWalletLedger(
  partnerUid: string,
  onUpdate: (rows: PartnerWalletTx[], balance: number) => void,
  onError?: (message: string) => void,
): () => void {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.partnerWalletTx), where('uid', '==', partnerUid));

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
      rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate(rows, computeBalance(rows));
    },
    (err) => onError?.(err.message),
  );
}

export async function requestPartnerWithdrawal(params: {
  partnerUid: string;
  payoutMethodId: string;
  amount: number;
  currency?: string;
  reference: string;
}): Promise<string> {
  const db = getDb();
  const refId = params.reference;

  const docRef = await addDoc(collection(db, COLLECTIONS.partnerWalletTx), {
    uid: params.partnerUid,
    kind: 'withdrawal_debit' as const,
    context: 'withdrawal_request' as const,
    status: 'pending' as const,
    amount: params.amount,
    currency: params.currency ?? 'USD',
    payoutMethodId: params.payoutMethodId,
    reference: refId,
    metadata: {
      payoutMethodId: params.payoutMethodId,
    },
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Architecture hook for backend/Cloud Functions.
 * Client never calls this in Phase 3.
 */
export async function backendConfirmPartnerWalletTx(_txId: string): Promise<void> {
  // Intentionally left as a placeholder for later backend wiring.
}

