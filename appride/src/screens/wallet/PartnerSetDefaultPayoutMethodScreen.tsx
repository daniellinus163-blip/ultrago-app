import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { setDefaultPartnerPayoutMethod, subscribePartnerPayoutMethods } from '../../services/partnerWallet/partnerPayoutMethodsFirestore';
import type { SavedPartnerPayoutMethod } from '../../types/partnerPayout';
import type { WalletStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<WalletStackParamList, 'PartnerSetDefaultPayoutMethod'>;

export function PartnerSetDefaultPayoutMethodScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const partnerUid = user?.uid;
  const { methodId } = route.params;

  const [methods, setMethods] = useState<SavedPartnerPayoutMethod[]>([]);

  useEffect(() => {
    if (!partnerUid) {
      return;
    }
    const unsub = subscribePartnerPayoutMethods(
      partnerUid,
      (rows) => setMethods(rows),
      () => setMethods([]),
    );
    return () => unsub();
  }, [partnerUid]);

  const method = useMemo(() => methods.find((m) => m.id === methodId), [methods, methodId]);

  async function onConfirm() {
    if (!partnerUid) {
      return;
    }
    setDefaultPartnerPayoutMethod({ partnerUid, methodId }).then(() => {
      Alert.alert('Payout method updated', 'This bank account is now your default payout method.');
      navigation.goBack();
    });
  }

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Set default payout method</Text>
        <Text style={styles.sub}>
          {method
            ? `${method.bankName ?? 'Bank'} •••• ${method.last4 ?? '—'}`
            : 'Confirm the payout method you just added.'}
        </Text>

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>For withdrawals</Text>
          <Text style={styles.previewBody}>
            The backend will use this saved bank metadata when payouts are enabled.
          </Text>
        </View>

        <AppButton title="Make default" onPress={() => void onConfirm()} />

        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.9 }]}>
          <Text style={styles.cancelTxt}>Not now</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  sub: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  preview: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  previewTitle: { fontWeight: '900', color: colors.text, fontSize: 16 },
  previewBody: { marginTop: spacing.xs, color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  cancel: { paddingVertical: spacing.sm },
  cancelTxt: { color: colors.textMuted, fontWeight: '800' },
});

