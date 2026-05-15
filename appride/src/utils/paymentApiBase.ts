/** Resolves the charge URL used by `gatewayRouter` (full URL or built from API base). */
export function resolvePaymentVerifyUrl(): string {
  const direct = process.env.EXPO_PUBLIC_PAYMENT_VERIFY_URL?.trim();
  if (direct) {
    return direct;
  }
  const base = process.env.EXPO_PUBLIC_PAYMENT_API_BASE?.trim().replace(/\/$/, '');
  if (base) {
    return `${base}/api/verify-charge`;
  }
  return '';
}
