import type { Timestamp } from 'firebase/firestore';

/** Shape of `paymentRecords` documents written by the app + backend. */
export type PaymentRecordStatus = 'pending' | 'success' | 'failed';

export type PaymentRecordRow = {
  id: string;
  uid: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentRecordStatus;
  reference: string;
  context: string;
  metadata?: Record<string, unknown>;
  /** millis since epoch for sorting */
  createdAtMs: number;
};

export function createdAtToMs(v: Timestamp | { seconds: number } | undefined | null): number {
  if (!v) {
    return 0;
  }
  if ('toMillis' in v && typeof v.toMillis === 'function') {
    return v.toMillis();
  }
  const s = 'seconds' in v ? v.seconds : 0;
  return s * 1000;
}
