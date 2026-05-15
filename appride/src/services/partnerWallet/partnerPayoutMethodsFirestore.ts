import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  type Timestamp,
  updateDoc,
  where,
  doc,
  writeBatch,
} from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import type { AddPartnerBankAccountInput, PartnerPayoutMethodType, SavedPartnerPayoutMethod } from '../../types/partnerPayout';
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

function mapDoc(id: string, data: Record<string, unknown>): SavedPartnerPayoutMethod {
  return {
    id,
    uid: String(data.uid ?? ''),
    type: (data.type as PartnerPayoutMethodType) ?? 'bank_account',
    status: (data.status as SavedPartnerPayoutMethod['status']) ?? 'pending',
    isDefault: Boolean(data.isDefault),
    bankName: typeof data.bankName === 'string' ? data.bankName : undefined,
    last4: typeof data.last4 === 'string' ? data.last4 : undefined,
    nickname: data.nickname != null ? String(data.nickname) : null,
    createdAtMs: createdAtToMs(data.createdAt as Timestamp),
  };
}

async function clearDefaultFlags(uid: string): Promise<void> {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.partnerPayoutMethods), where('uid', '==', uid), where('isDefault', '==', true));
  const snap = await getDocs(q);
  if (snap.empty) {
    return;
  }
  const batch = writeBatch(db);
  for (const d of snap.docs) {
    batch.update(d.ref, { isDefault: false });
  }
  await batch.commit();
}

export function subscribePartnerPayoutMethods(
  partnerUid: string,
  onUpdate: (methods: SavedPartnerPayoutMethod[]) => void,
  onError?: (message: string) => void,
): () => void {
  const db = getDb();
  const q = query(collection(db, COLLECTIONS.partnerPayoutMethods), where('uid', '==', partnerUid));

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

export async function addPartnerBankAccountPayoutMethod(params: {
  partnerUid: string;
  input: AddPartnerBankAccountInput;
}): Promise<string> {
  const db = getDb();
  const existing = await getDocs(query(collection(db, COLLECTIONS.partnerPayoutMethods), where('uid', '==', params.partnerUid)));
  const makeDefault = existing.empty;

  if (makeDefault) {
    await clearDefaultFlags(params.partnerUid);
  }

  const docRef = await addDoc(collection(db, COLLECTIONS.partnerPayoutMethods), {
    uid: params.partnerUid,
    type: 'bank_account' as const,
    status: makeDefault ? 'active' : 'pending',
    bankName: params.input.bankName.trim(),
    last4: params.input.last4,
    nickname: params.input.nickname?.trim() || null,
    isDefault: makeDefault,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function setDefaultPartnerPayoutMethod(params: { partnerUid: string; methodId: string }): Promise<void> {
  await clearDefaultFlags(params.partnerUid);
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.partnerPayoutMethods, params.methodId), { isDefault: true });
}

