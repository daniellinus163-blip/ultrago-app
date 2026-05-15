import type { PaymentProviderId } from '../../types/paymentMethod';

export type PaymentProviderMeta = {
  id: PaymentProviderId;
  label: string;
  regions: string;
  /** Env key hint for server-side secret (never in the app). */
  serverSecretEnv: string;
  clientPublicKeyEnv?: string;
  status: 'ready_for_integration' | 'coming_soon';
};

/**
 * Phase 2 — architecture only. Connect SDKs / Cloud Functions in a later phase.
 * Client stores method metadata in Firestore; charges run server-side with secrets.
 */
export const PAYMENT_PROVIDER_CATALOG: PaymentProviderMeta[] = [
  {
    id: 'stripe',
    label: 'Stripe',
    regions: 'Global',
    serverSecretEnv: 'STRIPE_SECRET_KEY',
    clientPublicKeyEnv: 'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    status: 'ready_for_integration',
  },
  {
    id: 'paystack',
    label: 'Paystack',
    regions: 'Nigeria & Africa',
    serverSecretEnv: 'PAYSTACK_SECRET_KEY',
    clientPublicKeyEnv: 'EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY',
    status: 'ready_for_integration',
  },
  {
    id: 'flutterwave',
    label: 'Flutterwave',
    regions: 'Africa & global cards',
    serverSecretEnv: 'FLUTTERWAVE_SECRET_KEY',
    clientPublicKeyEnv: 'EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY',
    status: 'ready_for_integration',
  },
];

export function preferredProviderFromEnv(): PaymentProviderId {
  const raw = (process.env.EXPO_PUBLIC_PAYMENT_PROVIDER ?? 'paystack').toLowerCase();
  if (raw === 'stripe' || raw === 'paystack' || raw === 'flutterwave') {
    return raw;
  }
  return 'manual';
}
