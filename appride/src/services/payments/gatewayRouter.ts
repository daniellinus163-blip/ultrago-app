import { resolvePaymentVerifyUrl } from '../../utils/paymentApiBase';
import { recordPaymentToFirestore } from './paymentRecords';
import type { PaymentRecordStatus } from '../../types/payment';

export type GatewayChargeResult = {
  ok: boolean;
  reference: string;
  provider: 'demo' | 'stripe' | 'paystack' | 'flutterwave';
  status: PaymentRecordStatus;
  message?: string;
  authorization_url?: string;
};

/**
 * Server-side charge verification. Point `EXPO_PUBLIC_PAYMENT_VERIFY_URL` or
 * `EXPO_PUBLIC_PAYMENT_API_BASE` at your local Paystack server (`npm run server`).
 */
export async function chargeViaConfiguredGateway(params: {
  uid: string;
  amount: number;
  currency?: string;
  context: string;
  metadata?: Record<string, unknown>;
}): Promise<GatewayChargeResult> {
  const verifyUrl = resolvePaymentVerifyUrl();
  const mode = (process.env.EXPO_PUBLIC_PAYMENT_MODE ?? 'demo').toLowerCase();
  const provider = (process.env.EXPO_PUBLIC_PAYMENT_PROVIDER as GatewayChargeResult['provider']) || 'demo';
  const currency =
    params.currency ?? process.env.EXPO_PUBLIC_PAYMENT_CURRENCY ?? 'NGN';

  if (!verifyUrl || mode === 'demo') {
    const reference = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await recordPaymentToFirestore({
      uid: params.uid,
      amount: params.amount,
      currency,
      provider: 'demo',
      status: 'success',
      reference,
      context: params.context,
      metadata: params.metadata,
    });
    return { ok: true, reference, provider: 'demo', status: 'success' };
  }

  try {
    const res = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amount,
        currency,
        uid: params.uid,
        context: params.context,
        metadata: params.metadata,
      }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      reference?: string;
      message?: string;
      authorization_url?: string;
    };
    const ok = Boolean(json.ok) && res.ok;
    const reference = String(json.reference ?? `srv-${Date.now()}`);
    const status: PaymentRecordStatus = ok ? 'success' : 'pending';
    if (ok) {
      await recordPaymentToFirestore({
        uid: params.uid,
        amount: params.amount,
        currency,
        provider,
        status: 'success',
        reference,
        context: params.context,
        metadata: { ...params.metadata, remoteMessage: json.message },
      });
    }
    return {
      ok,
      reference,
      provider,
      status: ok ? 'success' : 'pending',
      message: json.message,
      authorization_url: json.authorization_url,
    };
  } catch (e) {
    const reference = `err-${Date.now()}`;
    await recordPaymentToFirestore({
      uid: params.uid,
      amount: params.amount,
      currency,
      provider,
      status: 'failed',
      reference,
      context: params.context,
      metadata: { error: e instanceof Error ? e.message : 'network' },
    });
    return {
      ok: false,
      reference,
      provider,
      status: 'failed',
      message: 'Payment service unreachable. Is `npm run server` running on your PC?',
    };
  }
}
