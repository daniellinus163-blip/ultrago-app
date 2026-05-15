import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { getDb } from '../../services/firebase/firestore';
import { COLLECTIONS } from '../../constants/firebaseCollections';
import { subscribePartnerWalletLedger } from '../../services/partnerWallet/partnerWalletLedgerFirestore';
import type { PartnerWalletTx } from '../../types/partnerWallet';
import type { WalletStackParamList } from '../../navigation/types';
import { colors, gradients } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<WalletStackParamList, 'PartnerWalletHome'>;

function formatMoney(v: number): string {
  return `$${v.toFixed(2)}`;
}

export function PartnerWalletHomeScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const partnerUid = user?.uid;
  const role = profile?.appRole;

  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<PartnerWalletTx[]>([]);
  const [rideCompletedCount, setRideCompletedCount] = useState(0);
  const [foodDeliveredCount, setFoodDeliveredCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isDriver = role === 'driver';
  const isDeliveryRider = role === 'delivery_rider';

  useEffect(() => {
    if (!partnerUid) {
      return;
    }
    setLoading(true);
    const unsubLedger = subscribePartnerWalletLedger(
      partnerUid,
      (rows, computedBalance) => {
        setTxs(rows.slice(0, 12));
        setBalance(computedBalance);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsubLedger();
  }, [partnerUid]);

  useEffect(() => {
    if (!partnerUid) {
      return;
    }
    const db = getDb();
    if (isDriver) {
      const q = query(collection(db, COLLECTIONS.rides), where('driverId', '==', partnerUid), where('status', '==', 'completed'));
      return onSnapshot(q, (snap) => setRideCompletedCount(snap.size));
    }
    if (isDeliveryRider) {
      const q = query(
        collection(db, COLLECTIONS.foodOrders),
        where('deliveryRiderId', '==', partnerUid),
        where('status', '==', 'delivered'),
      );
      return onSnapshot(q, (snap) => setFoodDeliveredCount(snap.size));
    }
    return;
  }, [partnerUid, isDriver, isDeliveryRider]);

  const completedLabel = useMemo(() => {
    if (isDriver) {
      return `${rideCompletedCount} completed rides`;
    }
    if (isDeliveryRider) {
      return `${foodDeliveredCount} delivered orders`;
    }
    return 'Partner stats';
  }, [isDriver, isDeliveryRider, rideCompletedCount, foodDeliveredCount]);

  const onWithdraw = useCallback(() => {
    navigation.navigate('PartnerWithdraw');
  }, [navigation]);

  if (!user) {
    return (
      <Screen>
        <Text style={styles.error}>Sign in required.</Text>
      </Screen>
    );
  }

  return (
    <Screen safe={false} style={{ backgroundColor: colors.background }}>
      <LinearGradient colors={gradients.screenGold} style={StyleSheet.absoluteFill} />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={isDriver ? 'car' : 'bicycle'} size={26} color={colors.primary} />
          </View>
          <Text style={styles.heroLabel}>Current balance</Text>
          <Text style={styles.heroBalance} accessibilityRole="text">
            {loading ? '—' : formatMoney(balance)}
          </Text>
          <Text style={styles.heroSub}>{completedLabel}</Text>
          <Pressable
            onPress={onWithdraw}
            style={({ pressed }) => [styles.withdrawBtn, pressed && styles.withdrawBtnPressed]}
          >
            <Ionicons name="cash-outline" size={18} color={colors.textOnPrimary} />
            <Text style={styles.withdrawTxt}>Withdraw</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ledger (confirmed)</Text>
          {txs.length === 0 ? (
            <Text style={styles.empty}>No confirmed earnings or withdrawals yet.</Text>
          ) : (
            <View style={styles.txList}>
              {txs.map((t) => (
                <View key={t.id} style={styles.txRow}>
                  <View style={styles.txDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>
                      {t.kind === 'earning_credit' ? 'Earnings' : 'Withdrawal'} · {t.context.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.txMeta}>
                      {t.reference ? `Ref: ${t.reference}` : `Status: ${t.status}`}
                    </Text>
                  </View>
                  <Text style={[styles.txAmt, t.kind === 'earning_credit' ? styles.txIn : styles.txOut]}>
                    {t.kind === 'earning_credit' ? '+' : '-'}
                    {formatMoney(t.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  hero: {
    padding: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroBalance: {
    marginTop: spacing.xs,
    color: colors.text,
    fontWeight: '900',
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -0.5,
  },
  heroSub: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
  withdrawBtn: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  withdrawBtnPressed: { opacity: 0.9 },
  withdrawTxt: {
    color: colors.textOnPrimary,
    fontWeight: '900',
    fontSize: 16,
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
  },
  sectionTitle: { fontWeight: '900', color: colors.text, fontSize: 15 },
  empty: { marginTop: spacing.md, color: colors.textMuted, fontWeight: '600' },
  txList: { marginTop: spacing.md, gap: spacing.sm },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  txDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  txTitle: { fontWeight: '800', color: colors.text, fontSize: 13 },
  txMeta: { marginTop: 2, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  txAmt: { fontWeight: '900', fontSize: 14, minWidth: 86, textAlign: 'right' },
  txIn: { color: colors.success },
  txOut: { color: colors.error },
  error: { padding: spacing.lg, color: colors.error, fontWeight: '700' },
});

