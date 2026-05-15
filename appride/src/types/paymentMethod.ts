/** Saved customer payment instruments in Firestore — tokens only, never full PAN/account numbers. */
export type PaymentMethodType = 'debit_card' | 'bank_account';

/** Gateway ready for manual wiring in Phase 5+. */
export type PaymentProviderId = 'stripe' | 'paystack' | 'flutterwave' | 'manual';

export type PaymentMethodStatus = 'active' | 'pending_verification';

export type SavedPaymentMethod = {
  id: string;
  uid: string;
  type: PaymentMethodType;
  provider: PaymentProviderId;
  last4: string;
  nickname?: string;
  brand?: 'visa' | 'mastercard' | 'amex';
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  isDefault: boolean;
  status: PaymentMethodStatus;
  /** Provider token / authorization code — populated when live SDK is connected. */
  integrationRef?: string | null;
  createdAtMs: number;
};

export type AddDebitCardInput = {
  brand: SavedPaymentMethod['brand'];
  last4: string;
  expMonth: number;
  expYear: number;
  nickname?: string;
  provider?: PaymentProviderId;
};

export type AddBankAccountInput = {
  bankName: string;
  last4: string;
  nickname?: string;
  provider?: PaymentProviderId;
};
