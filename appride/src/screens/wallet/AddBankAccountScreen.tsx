import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { addBankAccountMethod } from '../../services/payments/paymentMethodsFirestore';
import { preferredProviderFromEnv } from '../../services/payments/paymentProviderConfig';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'AddBankAccount'>;

export function AddBankAccountScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [last4, setLast4] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (!user) {
      return;
    }
    if (!bankName.trim()) {
      Alert.alert('Bank', 'Enter your bank name.');
      return;
    }
    if (!/^\d{4}$/.test(last4)) {
      Alert.alert('Bank', 'Enter the last 4 digits of your account number.');
      return;
    }

    setBusy(true);
    try {
      await addBankAccountMethod(user.uid, {
        bankName: bankName.trim(),
        last4,
        nickname: nickname.trim() || undefined,
        provider: preferredProviderFromEnv(),
      });
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save bank account.';
      Alert.alert('Bank', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboardAvoid>
      <View style={styles.card}>
        <Text style={styles.note}>
          Bank details are stored as metadata in Firestore for your payout / debit setup. Account verification and
          transfers run on your backend when you connect Paystack, Flutterwave, or Stripe.
        </Text>
        <AppTextField label="Bank name" value={bankName} onChangeText={setBankName} placeholder="e.g. GTBank" />
        <AppTextField
          label="Account last 4 digits"
          value={last4}
          onChangeText={setLast4}
          keyboardType="number-pad"
          maxLength={4}
        />
        <AppTextField label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="Salary account" />
        <AppButton title="Save to Firebase" loading={busy} onPress={() => void onSave()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
