export type PartnerWalletTxKind = 'earning_credit' | 'withdrawal_debit';

export type PartnerWalletTxStatus = 'pending' | 'confirmed' | 'reversed';

export type PartnerWalletTxContext = 'ride_completed' | 'food_delivered' | 'withdrawal_request';

export type PartnerWalletTx = {
  id: string;
  /** Owner partner uid (driver or delivery rider). */
  uid: string;
  kind: PartnerWalletTxKind;
  context: PartnerWalletTxContext;
  status: PartnerWalletTxStatus;
  amount: number;
  currency: string;
  reference?: string | null;
  metadata?: Record<string, unknown>;
  createdAtMs: number;
};

export type AddPartnerWalletTxInput = {
  kind: PartnerWalletTxKind;
  context: PartnerWalletTxContext;
  amount: number;
  currency?: string;
  reference: string;
  metadata?: Record<string, unknown>;
};

