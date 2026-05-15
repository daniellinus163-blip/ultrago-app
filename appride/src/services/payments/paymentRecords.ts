import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { PaymentRecordStatus } from '../../types/payment';
import { getDb } from '../firebase/firestore';

export type { PaymentRecordStatus };

export async function recordPaymentToFirestore(params: {
  uid: string;
  amount: number;
  currency: string;
  provider: 'demo' | 'stripe' | 'paystack' | 'flutterwave';
  status: PaymentRecordStatus;
  reference: string;
  context: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await addDoc(collection(db, COLLECTIONS.paymentRecords), {
    ...params,
    createdAt: serverTimestamp(),
  });
}
