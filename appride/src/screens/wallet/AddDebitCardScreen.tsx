import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { addDebitCardMethod } from '../../services/payments/paymentMethodsFirestore';
import { preferredProviderFromEnv } from '../../services/payments/paymentProviderConfig';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { SavedPaymentMethod } from '../../types/paymentMethod';
import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'AddDebitCard'>;

const BRANDS: NonNullable<SavedPaymentMethod['brand']>[] = ['visa', 'mastercard', 'amex'];

export function AddDebitCardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [last4, setLast4] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [nickname, setNickname] = useState('');
  const [brandIdx, setBrandIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (!user) {
      return;
    }
    if (!/^\d{4}$/.test(last4)) {
      Alert.alert('Card', 'Enter the last 4 digits of your card.');
      return;
    }
    const month = Number(expMonth);
    const year = Number(expYear);
    if (month < 1 || month > 12) {
      Alert.alert('Card', 'Enter a valid expiry month (01–12).');
      return;
    }
    if (year < 2024 || year > 2099) {
      Alert.alert('Card', 'Enter a valid expiry year (YYYY).');
      return;
    }

    setBusy(true);
    try {
      await addDebitCardMethod(user.uid, {
        brand: BRANDS[brandIdx],
        last4,
        expMonth: month,
        expYear: year,
        nickname: nickname.trim() || undefined,
        provider: preferredProviderFromEnv(),
      });
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save card.';
      Alert.alert('Card', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboardAvoid>
      <View style={styles.card}>
        <Text style={styles.note}>
          Only metadata is stored in Firestore (brand, last 4, expiry). Full card numbers never touch this app — connect
          Stripe / Paystack tokenization on your server later.
        </Text>
        <Text style={styles.label}>Brand</Text>
        <View style={styles.row}>
          {BRANDS.map((b, i) => (
            <AppButton
              key={b}
              title={b}
              variant={brandIdx === i ? 'primary' : 'secondary'}
              onPress={() => setBrandIdx(i)}
              style={styles.brandBtn}
            />
          ))}
        </View>
        <AppTextField label="Last 4 digits" value={last4} onChangeText={setLast4} keyboardType="number-pad" maxLength={4} />
        <AppTextField label="Expiry month (MM)" value={expMonth} onChangeText={setExpMonth} keyboardType="number-pad" maxLength={2} />
        <AppTextField label="Expiry year (YYYY)" value={expYear} onChangeText={setExpYear} keyboardType="number-pad" maxLength={4} />
        <AppTextField label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="Personal card" />
        <AppButton title="Save to Firebase" loading={busy} onPress={() => void onSave()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  label: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  brandBtn: { minWidth: 100 },
});
