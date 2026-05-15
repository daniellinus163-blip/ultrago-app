import { Alert, Linking } from 'react-native';

import { chargeViaConfiguredGateway } from './gatewayRouter';

export type PaymentGateParams = {
  uid: string;
  email?: string | null;
  amount: number;
  currency?: string;
  context: string;
  metadata?: Record<string, unknown>;
};

/** Runs demo or live Paystack flow before placing an order or ride. */
export async function runPaymentGate(params: PaymentGateParams): Promise<boolean> {
  const baseMeta = {
    ...params.metadata,
    email: params.email ?? undefined,
  };

  const first = await chargeViaConfiguredGateway({
    uid: params.uid,
    amount: params.amount,
    currency: params.currency,
    context: params.context,
    metadata: baseMeta,
  });

  if (first.ok) {
    return true;
  }

  if (!first.authorization_url || !first.reference) {
    Alert.alert('Payment failed', first.message ?? 'Could not start payment.');
    return false;
  }

  const authUrl = first.authorization_url;
  const reference = first.reference;

  return new Promise((resolve) => {
    Alert.alert(
      'Paystack payment',
      'Open Paystack to pay, then return and tap Confirm payment.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Open Paystack',
          onPress: () => {
            void Linking.openURL(authUrl).catch(() => {
              Alert.alert('Payment', 'Could not open the Paystack checkout page.');
            });
          },
        },
        {
          text: 'Confirm payment',
          onPress: () => {
            void (async () => {
              const confirmed = await chargeViaConfiguredGateway({
                uid: params.uid,
                amount: params.amount,
                currency: params.currency,
                context: params.context,
                metadata: { ...baseMeta, reference },
              });
              if (!confirmed.ok) {
                Alert.alert('Payment', confirmed.message ?? 'Payment not verified yet. Try again in a moment.');
                resolve(false);
                return;
              }
              resolve(true);
            })();
          },
        },
      ],
    );
  });
}
