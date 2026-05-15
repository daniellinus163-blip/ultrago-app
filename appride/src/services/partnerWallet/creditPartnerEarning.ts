import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { PartnerWalletTxContext } from '../../types/partnerWallet';
import { getDb } from '../firebase/firestore';

/**
 * Phase 5 — credit partner wallet only after a successful completion.
 * Idempotent by `reference` (ride id or food order id).
 * Production: move to Cloud Functions after payment capture.
 */
export async function creditPartnerEarningOnCompletion(params: {
  partnerUid: string;
  amount: number;
  context: PartnerWalletTxContext;
  reference: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  if (params.amount <= 0) {
    return false;
  }
  const db = getDb();
  const existing = await getDocs(
    query(
      collection(db, COLLECTIONS.partnerWalletTx),
      where('uid', '==', params.partnerUid),
      where('reference', '==', params.reference),
      where('kind', '==', 'earning_credit'),
    ),
  );
  if (!existing.empty) {
    return false;
  }

  await addDoc(collection(db, COLLECTIONS.partnerWalletTx), {
    uid: params.partnerUid,
    kind: 'earning_credit',
    context: params.context,
    status: 'confirmed',
    amount: Math.round(params.amount * 100) / 100,
    currency: params.currency ?? 'USD',
    reference: params.reference,
    metadata: params.metadata ?? {},
    createdAt: serverTimestamp(),
  });
  return true;
}

/** Driver share of ride fare for MVP estimates & payout. */
export function estimateRidePartnerEarnings(fare: number): number {
  return Math.round(fare * 0.75 * 100) / 100;
}

/** Delivery rider earns the delivery fee on successful drop-off. */
export function estimateFoodDeliveryPartnerEarnings(deliveryFee: number): number {
  return Math.round(deliveryFee * 100) / 100;
}
