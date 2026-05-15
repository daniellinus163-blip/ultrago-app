import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { FoodStackParamList, MainTabParamList } from '../../navigation/types';
import { syncFoodOrderToFirestore } from '../../services/food/foodOrdersFirestore';
import { runPaymentGate } from '../../services/payments/runPaymentGate';
import { cartSubtotal, useFoodCartStore } from '../../store/foodCartStore';
import { useFoodOrderStore } from '../../store/foodOrderStore';
import { usePaymentMethodsStore } from '../../store/paymentMethodsStore';
import { useRecentlyOrderedStore } from '../../store/recentlyOrderedStore';
import { useWalletStore } from '../../store/walletStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FoodOrder } from '../../types/food';
import { ensureCustomerPaymentMethod } from '../../utils/paymentMethodGate';

type Props = NativeStackScreenProps<FoodStackParamList, 'FoodCheckout'>;

function randomId(): string {
  return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function FoodCheckoutScreen({ navigation }: Props) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, profile } = useAuth();
  const lines = useFoodCartStore((s) => s.lines);
  const clear = useFoodCartStore((s) => s.clear);
  const addOrder = useFoodOrderStore((s) => s.addOrder);
  const updateOrder = useFoodOrderStore((s) => s.updateOrder);
  const foodPromoPercent = useWalletStore((s) => s.foodPromoPercent);
  const discountedFoodTotal = useWalletStore((s) => s.discountedFoodTotal);
  const touchRestaurant = useRecentlyOrderedStore((s) => s.touchRestaurant);
  const defaultMethod = usePaymentMethodsStore((s) => s.methods.find((m) => m.isDefault) ?? s.methods[0]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const sub = cartSubtotal(lines);
  const delivery = lines.length ? 2.49 : 0;

  const { discount, total } = useMemo(
    () => discountedFoodTotal(sub, delivery),
    [sub, delivery, discountedFoodTotal, foodPromoPercent],
  );

  async function onPlace() {
    if (!lines.length || !user) {
      return;
    }
    if (!ensureCustomerPaymentMethod(tabNav)) {
      return;
    }
    setBusy(true);
    try {
      const paid = await runPaymentGate({
        uid: user.uid,
        email: user.email,
        amount: total,
        context: 'food_checkout',
        metadata: { paymentMethodId: defaultMethod?.id, orderPreview: lines.length },
      });
      if (!paid) {
        return;
      }

      const id = randomId();
      const order: FoodOrder = {
        id,
        placedAt: Date.now(),
        lines: [...lines],
        subtotal: sub,
        deliveryFee: delivery,
        status: 'received',
        customerId: user.uid,
      };
      addOrder(order);
      touchRestaurant(lines[0].restaurantId);
      try {
        updateOrder(id, { status: 'preparing' });
        await syncFoodOrderToFirestore(
          { ...order, status: 'preparing' },
          user.uid,
          {
            paymentMethodId: defaultMethod?.id,
            total,
            customerDisplayName: profile?.displayName ?? user.displayName ?? 'Customer',
            deliveryAddressLabel: notes.trim() || 'Address on file',
          },
        );
      } catch {
        /* Firestore optional when offline / rules */
      }
      clear();
      navigation.replace('FoodOrderTracking', { orderId: id });
    } catch {
      Alert.alert('Checkout', 'Could not place order.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboardAvoid>
      <Text style={styles.phase}>Phase 6 checkout</Text>
      <View style={styles.card}>
        <AppTextField label="Notes for courier" value={notes} onChangeText={setNotes} placeholder="Gate code, table, etc." />
        {defaultMethod ? (
          <Text style={styles.payLine}>
            Payment method ·{' '}
            {defaultMethod.type === 'bank_account'
              ? `${defaultMethod.bankName ?? 'Bank'} •••• ${defaultMethod.last4}`
              : `${(defaultMethod.brand ?? 'card').toUpperCase()} •••• ${defaultMethod.last4}`}
          </Text>
        ) : (
          <Text style={styles.payWarn}>Add a payment method in the Pay tab before checkout.</Text>
        )}
        <View style={styles.sum}>
          <Row label="Subtotal" value={`$${sub.toFixed(2)}`} />
          {discount > 0 ? <Row label="Promo discount" value={`−$${discount.toFixed(2)}`} accent /> : null}
          <Row label="Delivery" value={`$${delivery.toFixed(2)}`} />
          <Row label="Total" value={`$${total.toFixed(2)}`} bold />
        </View>
        <Text style={styles.chargeNote}>
          Payment runs through Paystack when live mode is enabled (`npm run server` on your PC + LAN URL in `.env`).
        </Text>
        <AppButton title="Place order" loading={busy} disabled={!lines.length} onPress={() => void onPlace()} />
      </View>
    </Screen>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold, accent && styles.rowValueAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  phase: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  payLine: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  payWarn: { color: colors.accentOrange, fontSize: 14, fontWeight: '700' },
  chargeNote: { fontSize: 11, color: colors.textSubtle, lineHeight: 16 },
  sum: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: colors.textMuted, fontSize: 15 },
  rowLabelBold: { color: colors.text, fontWeight: '800' },
  rowValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowValueBold: { fontSize: 17, fontWeight: '800' },
  rowValueAccent: { color: colors.primary },
});
