export type WalletTxKind = 'ride' | 'food' | 'top_up' | 'promo_credit' | 'refund';

export type WalletTransaction = {
  id: string;
  at: number;
  kind: WalletTxKind;
  title: string;
  /** Negative = money out, positive = money in (USD). */
  amount: number;
  refId?: string;
};

export type SavedCard = {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  nickname?: string;
};
