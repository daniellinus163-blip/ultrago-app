import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type {
  AddBankAccountInput,
  AddDebitCardInput,
  PaymentMethodStatus,
  PaymentProviderId,
  SavedPaymentMethod,
} from '../../types/paymentMethod';
import { getDb } from '../firebase/firestore';
import { preferredProviderFromEnv } from './paymentProviderConfig';

function createdAtToMs(v: Timestamp | { seconds: number } | undefined | null): number {
  if (!v) {
    return Date.now();
  }
  if ('toMillis' in v && typeof v.toMillis === 'function') {
    return v.toMillis();
  }
  return ('seconds' in v ? v.seconds : 0) * 1000;
}

function mapDoc(id: string, data: Record<string, unknown>): SavedPaymentMethod {
  return {
    id,
    uid: String(data.uid ?? ''),
    type: (data.type as SavedPaymentMethod['type']) ?? 'debit_card',
    provider: (data.provider as PaymentProviderId) ?? 'manual',
    last4: String(data.last4 ?? ''),
    nickname: typeof data.nickname === 'string' ? data.nickname : undefined,
    brand: data.brand as SavedPaymentMethod['brand'],
    expMonth: typeof data.expMonth === 'number' ? data.expMonth : undefined,
    expYear: typeof data.expYear === 'number' ? data.expYear : undefined,
    bankName: typeof data.bankName === 'string' ? data.bankName : undefined,
    isDefault: Boolean(data.isDefault),
    status: (data.status as PaymentMethodStatus) ?? 'active',
    integrationRef: data.integrationRef != null ? String(data.integrationRef) : null,
    createdAtMs: createdAtToMs(data.createdAt as Timestamp),
  };
}

async function clearDefaultFlags(uid: string): Promise<void> {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.paymentMethods), where('uid', '==', uid), where('isDefault', '==', true));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  for (const d of snap.docs) {
    batch.update(d.ref, { isDefault: false });
  }
  if (!snap.empty) {
    await batch.commit();
  }
}

export function subscribePaymentMethods(
  uid: string,
  onUpdate: (methods: SavedPaymentMethod[]) => void,
  onError?: (message: string) => void,
): () => void {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.paymentMethods), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
      rows.sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }
        return b.createdAtMs - a.createdAtMs;
      });
      onUpdate(rows);
    },
    (err) => onError?.(err.message),
  );
}

export async function addDebitCardMethod(uid: string, input: AddDebitCardInput): Promise<string> {
  const db = getDb();
  const provider = input.provider ?? preferredProviderFromEnv();
  const existing = await getDocs(query(collection(db, COLLECTIONS.paymentMethods), where('uid', '==', uid)));
  const makeDefault = existing.empty;

  if (makeDefault) {
    await clearDefaultFlags(uid);
  }

  const ref = await addDoc(collection(db, COLLECTIONS.paymentMethods), {
    uid,
    type: 'debit_card',
    provider,
    brand: input.brand ?? 'visa',
    last4: input.last4,
    expMonth: input.expMonth,
    expYear: input.expYear,
    nickname: input.nickname?.trim() || null,
    isDefault: makeDefault,
    status: 'active' satisfies PaymentMethodStatus,
    integrationRef: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addBankAccountMethod(uid: string, input: AddBankAccountInput): Promise<string> {
  const db = getDb();
  const provider = input.provider ?? preferredProviderFromEnv();
  const existing = await getDocs(query(collection(db, COLLECTIONS.paymentMethods), where('uid', '==', uid)));
  const makeDefault = existing.empty;

  if (makeDefault) {
    await clearDefaultFlags(uid);
  }

  const ref = await addDoc(collection(db, COLLECTIONS.paymentMethods), {
    uid,
    type: 'bank_account',
    provider,
    bankName: input.bankName.trim(),
    last4: input.last4,
    nickname: input.nickname?.trim() || null,
    isDefault: makeDefault,
    status: 'pending_verification' satisfies PaymentMethodStatus,
    integrationRef: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function removePaymentMethod(methodId: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.paymentMethods, methodId));
}

export async function setDefaultPaymentMethod(uid: string, methodId: string): Promise<void> {
  await clearDefaultFlags(uid);
  await updateDoc(doc(getDb(), COLLECTIONS.paymentMethods, methodId), { isDefault: true });
}
