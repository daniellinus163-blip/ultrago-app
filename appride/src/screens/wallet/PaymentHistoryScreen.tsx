import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import type { WalletStackParamList } from '../../navigation/types';
import { subscribePaymentRecords } from '../../services/payments/subscribePaymentRecords';
import type { PaymentRecordRow } from '../../types/payment';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<WalletStackParamList, 'PaymentHistory'>;

function statusColor(s: PaymentRecordRow['status']) {
  if (s === 'success') {
    return colors.success;
  }
  if (s === 'failed') {
    return colors.error;
  }
  return colors.primary;
}

export function PaymentHistoryScreen({}: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<PaymentRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = subscribePaymentRecords(
      user.uid,
      (next) => {
        setRows(next);
        setLoading(false);
        setRefreshing(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
        setRefreshing(false);
      },
    );
    return unsub;
  }, [user]);

  function onRefresh() {
    setRefreshing(true);
    /** Snapshot pushes fresh data; brief UX delay if rules block reads. */
    setTimeout(() => setRefreshing(false), 600);
  }

  if (!user) {
    return (
      <Screen>
        <Text style={styles.empty}>Sign in to see gateway payment history.</Text>
      </Screen>
    );
  }

  if (loading && rows.length === 0) {
    return (
      <Screen>
        <View style={styles.skel}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={72} style={styles.skelRow} />
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.intro}>
        Charges from rides, food checkout, and wallet top-ups are recorded here when payment mode is demo or when your
        backend at EXPO_PUBLIC_PAYMENT_VERIFY_URL approves live charges.
      </Text>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No gateway records yet — top up the wallet or complete a ride/food checkout.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.pill, { borderColor: statusColor(item.status) }]}>
                <Text style={[styles.pillTxt, { color: statusColor(item.status) }]}>{item.status}</Text>
              </View>
              <Text style={styles.amt}>
                {item.currency} ${item.amount.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.ctx}>{item.context.replace(/_/g, ' ')}</Text>
            <Text style={styles.ref} numberOfLines={1}>
              Ref · {item.reference}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="prism-outline" size={14} color={colors.textMuted} />
              <Text style={styles.meta}>{item.provider}</Text>
              {item.createdAtMs ? (
                <Text style={styles.metaDot}>·</Text>
              ) : null}
              {item.createdAtMs ? (
                <Text style={styles.meta}>{new Date(item.createdAtMs).toLocaleString()}</Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  err: {
    marginHorizontal: spacing.lg,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  skel: { padding: spacing.lg, gap: spacing.sm },
  skelRow: { borderRadius: 14 },
  card: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.goldTint,
  },
  pillTxt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  amt: { fontSize: 17, fontWeight: '900', color: colors.text },
  ctx: { marginTop: spacing.sm, fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  ref: { marginTop: 4, fontSize: 12, color: colors.textSubtle },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, flexWrap: 'wrap', gap: 6 },
  meta: { fontSize: 12, color: colors.textMuted },
  metaDot: { color: colors.textSubtle },
});
