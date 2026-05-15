export type PartnerPayoutMethodType = 'bank_account';

export type PartnerPayoutMethodStatus = 'active' | 'pending' | 'inactive';

export type SavedPartnerPayoutMethod = {
  id: string;
  uid: string;
  type: PartnerPayoutMethodType;
  status: PartnerPayoutMethodStatus;
  isDefault: boolean;
  /** Stored as metadata for now (Phase 3) — backend must tokenize. */
  bankName?: string;
  last4?: string;
  nickname?: string | null;
  createdAtMs: number;
};

export type AddPartnerBankAccountInput = {
  bankName: string;
  last4: string;
  nickname?: string;
};

