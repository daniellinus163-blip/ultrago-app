import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { useWalletStore } from '../../store/walletStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'WalletTransactions'>;

export function WalletTransactionsScreen({}: Props) {
  const transactions = useWalletStore((s) => s.transactions);

  return (
    <Screen>
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No wallet movements yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{new Date(item.at).toLocaleString()}</Text>
              {item.refId ? <Text style={styles.ref}>Ref {item.refId.slice(0, 12)}…</Text> : null}
            </View>
            <Text style={[styles.amt, item.amount < 0 ? styles.out : styles.in]}>
              {item.amount < 0 ? '-' : '+'}${Math.abs(item.amount).toFixed(2)}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    alignItems: 'center',
  },
  title: { fontWeight: '700', color: colors.text, fontSize: 16 },
  meta: { marginTop: 4, color: colors.textMuted, fontSize: 12 },
  ref: { marginTop: 2, color: colors.textSubtle, fontSize: 11 },
  amt: { fontWeight: '800', fontSize: 17 },
  out: { color: colors.error },
  in: { color: colors.success },
});
