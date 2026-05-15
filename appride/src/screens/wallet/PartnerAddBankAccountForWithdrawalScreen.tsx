import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { addPartnerBankAccountPayoutMethod } from '../../services/partnerWallet/partnerPayoutMethodsFirestore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'PartnerAddBankAccountForWithdrawal'>;

export function PartnerAddBankAccountForWithdrawalScreen({ navigation }: Props) {
  const { user } = useAuth();
  const partnerUid = user?.uid;

  const [bankName, setBankName] = useState('');
  const [last4, setLast4] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (!partnerUid) {
      return;
    }
    if (!bankName.trim()) {
      Alert.alert('Bank', 'Enter a bank name.');
      return;
    }
    if (!/^\\d{4}$/.test(last4)) {
      Alert.alert('Bank', 'Enter the last 4 digits of your account.');
      return;
    }

    setBusy(true);
    try {
      const methodId = await addPartnerBankAccountPayoutMethod({
        partnerUid,
        input: {
          bankName: bankName.trim(),
          last4,
          nickname: nickname.trim() || undefined,
        },
      });
      navigation.navigate('PartnerSetDefaultPayoutMethod', { methodId });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save bank account.';
      Alert.alert('Save failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboardAvoid>
      <View style={styles.card}>
        <Text style={styles.title}>Add bank account</Text>
        <Text style={styles.sub}>
          This step stores bank metadata in Firestore. Tokenization and real payouts are handled by your backend in Phase 5+.
        </Text>

        <AppTextField label="Bank name" value={bankName} onChangeText={setBankName} placeholder="e.g. GTBank" />
        <AppTextField label="Account last 4 digits" value={last4} onChangeText={setLast4} keyboardType="number-pad" maxLength={4} />
        <AppTextField label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="Salary account" />

        <AppButton title="Continue" loading={busy} onPress={() => void onSave()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  sub: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '600' },
});

