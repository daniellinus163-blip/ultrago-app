import express from 'express';

import paystack from './paystack.mjs';

const router = express.Router();

/** @type {Map<string, { uid: string; amount: number; context: string }>} */
const pendingByReference = new Map();

function paystackError(res, err) {
  const body = err.response?.data;
  const message = body?.message || err.message || 'Paystack request failed';
  return res.status(err.response?.status ?? 500).json({ ok: false, message, details: body });
}

function toMinorUnits(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('Invalid amount');
  }
  const zeroDecimal = new Set(['JPY']);
  if (zeroDecimal.has(String(currency).toUpperCase())) {
    return Math.round(n);
  }
  return Math.round(n * 100);
}

// Gateway used by the mobile app (EXPO_PUBLIC_PAYMENT_VERIFY_URL → /api/verify-charge)
router.post('/verify-charge', async (req, res) => {
  try {
    const { amount, currency = 'NGN', uid, context, metadata = {} } = req.body ?? {};
    const email =
      metadata.email ||
      req.body.email ||
      (uid ? `user_${String(uid).slice(0, 12)}@appride.app` : 'customer@appride.app');

    if (metadata.reference) {
      const ref = String(metadata.reference);
      const verify = await paystack.get(`/transaction/verify/${encodeURIComponent(ref)}`);
      const data = verify.data?.data;
      const ok = data?.status === 'success';
      if (ok) {
        pendingByReference.delete(ref);
      }
      return res.json({
        ok,
        reference: data?.reference ?? ref,
        message: ok ? 'Payment verified.' : 'Payment not completed yet.',
      });
    }

    const minor = toMinorUnits(amount, currency);
    const init = await paystack.post('/transaction/initialize', {
      email,
      amount: minor,
      currency: String(currency).toUpperCase(),
      metadata: { uid, context, ...metadata },
      callback_url: process.env.PAYSTACK_CALLBACK_URL || undefined,
    });

    const data = init.data?.data;
    const reference = data?.reference;
    if (reference && uid) {
      pendingByReference.set(reference, { uid: String(uid), amount: Number(amount), context: String(context ?? '') });
    }

    return res.json({
      ok: false,
      reference,
      authorization_url: data?.authorization_url,
      message: 'Open Paystack to complete payment, then tap Confirm in the app.',
    });
  } catch (err) {
    return paystackError(res, err);
  }
});

router.post('/create-customer', async (req, res) => {
  try {
    const { email, first_name, last_name, phone } = req.body;
    const response = await paystack.post('/customer', {
      email,
      first_name,
      last_name,
      phone,
    });
    res.json(response.data);
  } catch (err) {
    paystackError(res, err);
  }
});

router.post('/create-account', async (req, res) => {
  try {
    const { customer_code } = req.body;
    const response = await paystack.post('/dedicated_account', {
      customer: customer_code,
      preferred_bank: 'wema-bank',
    });
    res.json(response.data);
  } catch (err) {
    paystackError(res, err);
  }
});

router.post('/paystack/webhook', (req, res) => {
  const event = req.body;
  if (event?.event === 'charge.success') {
    const ref = event.data?.reference;
    const pending = ref ? pendingByReference.get(ref) : undefined;
    console.log('Payment successful:', ref, pending ? `uid=${pending.uid}` : '');
    if (ref) {
      pendingByReference.delete(ref);
    }
  }
  res.sendStatus(200);
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, provider: 'paystack' });
});

export default router;
