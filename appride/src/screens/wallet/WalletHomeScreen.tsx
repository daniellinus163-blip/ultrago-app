import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { removePaymentMethod, setDefaultPaymentMethod } from '../../services/payments/paymentMethodsFirestore';
import { usePaymentMethodsStore } from '../../store/paymentMethodsStore';
import type { SavedPaymentMethod } from '../../types/paymentMethod';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'WalletHome'>;

function methodLabel(m: SavedPaymentMethod): string {
  if (m.type === 'bank_account') {
    return `${m.bankName ?? 'Bank'} · •••• ${m.last4}`;
  }
  return `${(m.brand ?? 'card').toUpperCase()} · •••• ${m.last4}`;
}

export function WalletHomeScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const methods = usePaymentMethodsStore((s) => s.methods);
  const loading = usePaymentMethodsStore((s) => s.loading);
  const error = usePaymentMethodsStore((s) => s.error);
  const firstFocus = useRef(true);
  const [booting, setBooting] = useState(true);

  const isCustomer = profile?.appRole === 'customer';

  // Partner wallet (Phase 3) lives under a different route in the same Wallet stack.
  React.useEffect(() => {
    if (!isCustomer) {
      navigation.replace('PartnerWalletHome');
    }
  }, [isCustomer, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!firstFocus.current) {
        setBooting(false);
        return;
      }
      firstFocus.current = false;
      const t = setTimeout(() => setBooting(false), 280);
      return () => clearTimeout(t);
    }, []),
  );

  if (!isCustomer) {
    return null;
  }

  async function onRemove(m: SavedPaymentMethod) {
    Alert.alert('Remove method', `Remove ${methodLabel(m)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void removePaymentMethod(m.id),
      },
    ]);
  }

  async function onSetDefault(m: SavedPaymentMethod) {
    if (!user || m.isDefault) {
      return;
    }
    try {
      await setDefaultPaymentMethod(user.uid, m.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update default.';
      Alert.alert('Payment method', message);
    }
  }

  if (booting || loading) {
    return (
      <Screen>
        <View style={styles.skelPad}>
          <Skeleton height={72} style={{ borderRadius: 14, marginBottom: spacing.md }} />
          <Skeleton height={72} style={{ borderRadius: 14, marginBottom: spacing.md }} />
          <Skeleton height={48} style={{ borderRadius: 14 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={methods}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Payment methods</Text>
            <Text style={styles.sub}>
              Saved to Firebase. Add a card or bank account before requesting rides or food delivery.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="card-outline" size={40} color={colors.textSubtle} />
            <Text style={styles.empty}>No payment methods yet.</Text>
            <Text style={styles.emptySub}>You need at least one to book rides or order food.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.isDefault && styles.cardDefault]}>
            <View style={styles.cardIcon}>
              <Ionicons
                name={item.type === 'bank_account' ? 'business-outline' : 'card-outline'}
                size={22}
                color={colors.primary}
              />
            </View>
            <Pressable style={{ flex: 1 }} onPress={() => void onSetDefault(item)}>
              <Text style={styles.cardTitle}>{methodLabel(item)}</Text>
              {item.nickname ? <Text style={styles.cardNick}>{item.nickname}</Text> : null}
              <Text style={styles.cardMeta}>
                {item.provider.toUpperCase()}
                {item.status === 'pending_verification' ? ' · Pending verification' : ''}
                {item.isDefault ? ' · Default' : ' · Tap to set default'}
              </Text>
            </Pressable>
            <Pressable onPress={() => void onRemove(item)} hitSlop={10}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <AppButton title="Add payment method" onPress={() => navigation.navigate('AddPaymentMethodHub')} />
            <Text style={styles.footerNote}>
              Charges are not processed in-app yet. Your backend will use Stripe, Paystack, or Flutterwave with server
              secrets when you connect Phase 5 payments.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  skelPad: { padding: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  sub: { marginTop: spacing.sm, color: colors.textMuted, lineHeight: 20, fontSize: 14, marginBottom: spacing.lg },
  error: { color: colors.error, marginBottom: spacing.md, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  empty: { fontWeight: '800', color: colors.text, fontSize: 16 },
  emptySub: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  cardDefault: { borderColor: colors.primary },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.goldTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '800', color: colors.text, fontSize: 16 },
  cardNick: { marginTop: 2, color: colors.textMuted, fontSize: 13 },
  cardMeta: { marginTop: 4, fontSize: 11, color: colors.textSubtle, fontWeight: '600' },
  remove: { color: colors.error, fontWeight: '700', fontSize: 13 },
  footer: { marginTop: spacing.md },
  footerNote: { marginTop: spacing.md, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
});
