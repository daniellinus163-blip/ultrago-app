import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { subscribePartnerPayoutMethods } from '../../services/partnerWallet/partnerPayoutMethodsFirestore';
import { requestPartnerWithdrawal } from '../../services/partnerWallet/partnerWalletLedgerFirestore';
import type { SavedPartnerPayoutMethod } from '../../types/partnerPayout';
import type { WalletStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<WalletStackParamList, 'PartnerWithdraw'>;

export function PartnerWithdrawScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const partnerUid = user?.uid;
  const partnerRole = profile?.appRole;

  const [methods, setMethods] = useState<SavedPartnerPayoutMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!partnerUid) {
      return;
    }
    setLoadingMethods(true);
    const unsub = subscribePartnerPayoutMethods(
      partnerUid,
      (rows) => {
        setMethods(rows);
        setSelectedMethodId((prev) => {
          if (prev && rows.some((m) => m.id === prev)) {
            return prev;
          }
          return rows.find((m) => m.isDefault)?.id ?? rows[0]?.id ?? null;
        });
        setLoadingMethods(false);
      },
      () => setLoadingMethods(false),
    );
    return () => unsub();
  }, [partnerUid]);

  const selectedMethod = useMemo(
    () => methods.find((m) => m.id === selectedMethodId),
    [methods, selectedMethodId],
  );

  const onAddBank = useCallback(() => {
    navigation.navigate('PartnerAddBankAccountForWithdrawal');
  }, [navigation]);

  async function onWithdraw() {
    if (!partnerUid || !selectedMethod) {
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('Withdrawal', 'Enter a valid amount.');
      return;
    }

    setBusy(true);
    try {
      const ref = `wd-${Date.now()}`;
      await requestPartnerWithdrawal({
        partnerUid,
        payoutMethodId: selectedMethod.id,
        amount: Math.round(n * 100) / 100,
        reference: ref,
      });
      Alert.alert('Withdrawal request sent', 'Your request is pending. Backend will process payouts later.');
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not create withdrawal request.';
      Alert.alert('Withdrawal failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboardAvoid>
      <View style={styles.header}>
        <Text style={styles.title}>Withdraw earnings</Text>
        <Text style={styles.sub}>
          {partnerRole === 'driver' ? 'Driver withdrawals' : 'Delivery rider withdrawals'} · backend processing later
        </Text>
      </View>

      {loadingMethods ? (
        <Text style={styles.loading}>Loading payout methods…</Text>
      ) : methods.length === 0 ? (
        <View style={styles.card}>
          <Ionicons name="wallet-outline" size={32} color={colors.primary} />
          <Text style={styles.cardTitle}>No payout method saved</Text>
          <Text style={styles.cardSub}>Add your bank account to enable withdrawals.</Text>
          <AppButton title="Add bank account" onPress={onAddBank} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Payout method</Text>
          {methods.map((m) => {
            const on = m.id === selectedMethodId;
            return (
              <Pressable
                key={m.id}
                onPress={() => setSelectedMethodId(m.id)}
                style={({ pressed }) => [styles.methodRow, on && styles.methodRowOn, pressed && { opacity: 0.9 }]}
              >
                <View style={[styles.methodDot, on && styles.methodDotOn]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>{m.bankName ?? 'Bank'} •••• {m.last4 ?? '—'}</Text>
                  <Text style={styles.methodMeta}>{m.isDefault ? 'Default' : 'Tap to select'}</Text>
                </View>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={on ? colors.primary : colors.textMuted} />
              </Pressable>
            );
          })}

          <AppTextField label="Amount (USD)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

          <AppButton title="Request withdrawal" loading={busy} onPress={() => void onWithdraw()} />

          <Text style={styles.note}>
            This build does not transfer funds yet. It only creates withdrawal requests and expects the backend to
            mark them confirmed when payouts succeed.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  sub: { marginTop: spacing.xs, color: colors.textMuted, fontWeight: '600', lineHeight: 18, fontSize: 13 },
  loading: { padding: spacing.lg, color: colors.textMuted, fontWeight: '600' },
  card: { padding: spacing.lg, gap: spacing.md },
  cardTitle: { fontWeight: '900', color: colors.text, fontSize: 16 },
  cardSub: { color: colors.textMuted, fontWeight: '600', lineHeight: 20, fontSize: 13 },
  sectionLabel: { fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  methodRowOn: { borderColor: colors.primary },
  methodDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.borderSubtle, borderWidth: 1, borderColor: colors.borderSubtle },
  methodDotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodTitle: { fontWeight: '900', color: colors.text, fontSize: 14 },
  methodMeta: { marginTop: 2, color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  note: { marginTop: spacing.sm, color: colors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '600' },
});

