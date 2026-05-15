import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { PartnerProfileCard } from '../../components/partner/PartnerProfileCard';
import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useLocalFoodOrderNotifications } from '../../hooks/useLocalFoodOrderNotifications';
import { confirmFoodDeliveryByCustomer } from '../../services/food/completeFoodDelivery';
import { fetchPartnerPublicProfile } from '../../services/matching/partnerProfiles';
import { subscribeFoodOrder } from '../../services/food/foodOrderSubscriptions';
import { useFoodOrderStore } from '../../store/foodOrderStore';
import type { PartnerPublicProfile } from '../../types/partner';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FoodOrderStatus } from '../../types/food';
import type { FoodStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FoodStackParamList, 'FoodOrderTracking'>;

const STEPS: { status: FoodOrderStatus; label: string; sub: string }[] = [
  { status: 'received', label: 'Order received', sub: 'Kitchen is confirming your items.' },
  { status: 'preparing', label: 'Preparing', sub: 'Chef team is on it — quality over rush.' },
  { status: 'out_for_delivery', label: 'Out for delivery', sub: 'Partner is en route with thermal bag.' },
  { status: 'delivered', label: 'Delivered', sub: 'Confirm receipt to complete payment & rider earnings.' },
];

export function FoodOrderTrackingScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const localOrder = useFoodOrderStore((s) => s.orders.find((o) => o.id === orderId));
  const updateOrder = useFoodOrderStore((s) => s.updateOrder);
  const [remoteOrder, setRemoteOrder] = useState(localOrder ?? null);
  const [riderProfile, setRiderProfile] = useState<PartnerPublicProfile | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const order = remoteOrder ?? localOrder;

  useEffect(() => {
    return subscribeFoodOrder(orderId, (o) => {
      if (o) {
        setRemoteOrder(o);
        updateOrder(orderId, o);
      }
    });
  }, [orderId, updateOrder]);

  const status = order?.status;
  const deliveryRiderId = order?.deliveryRiderId ?? null;

  useEffect(() => {
    if (!deliveryRiderId) {
      setRiderProfile(null);
      return;
    }
    void fetchPartnerPublicProfile(deliveryRiderId).then(setRiderProfile);
  }, [deliveryRiderId]);

  useLocalFoodOrderNotifications(status);

  const activeIdx = useMemo(() => {
    if (!order) {
      return 0;
    }
    const i = STEPS.findIndex((s) => s.status === order.status);
    return i === -1 ? 0 : i;
  }, [order]);

  async function onConfirmDelivery() {
    setConfirmBusy(true);
    try {
      await confirmFoodDeliveryByCustomer(orderId);
      updateOrder(orderId, { customerConfirmedDelivery: true });
      Alert.alert('Thank you', 'Delivery confirmed. Your rider earnings have been released.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not confirm delivery.';
      Alert.alert('Confirmation', message);
    } finally {
      setConfirmBusy(false);
    }
  }

  if (!order) {
    return (
      <Screen>
        <Text style={styles.miss}>Order not found.</Text>
        <AppButton title="Browse food" onPress={() => navigation.navigate('FoodRestaurants')} />
      </Screen>
    );
  }

  const showConfirm =
    order.status === 'delivered' && !order.customerConfirmedDelivery;

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.phase}>Phase 5 · Live tracking</Text>
        <Text style={styles.id}>Order {order.id.slice(-10)}</Text>
        <Text style={styles.total}>${(order.subtotal + order.deliveryFee).toFixed(2)}</Text>
        {riderProfile ? (
          <View style={styles.riderBlock}>
            <Text style={styles.riderLabel}>Your delivery partner</Text>
            <PartnerProfileCard profile={riderProfile} subtitle="Assigned rider" compact />
          </View>
        ) : status === 'preparing' || status === 'received' ? (
          <Text style={styles.waiting}>Matching a delivery rider near you…</Text>
        ) : null}
        {STEPS.map((step, i) => {
          const done = i <= activeIdx;
          const current = i === activeIdx;
          return (
            <View key={step.status} style={[styles.step, current && styles.stepCurrent]}>
              <View style={[styles.dot, done && styles.dotOn]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, done && styles.stepTitleOn]}>{step.label}</Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          );
        })}
        {showConfirm ? (
          <AppButton
            title="I received my order"
            loading={confirmBusy}
            onPress={() => void onConfirmDelivery()}
            style={styles.confirmBtn}
          />
        ) : null}
        {order.customerConfirmedDelivery ? (
          <Text style={styles.confirmed}>Delivery confirmed · payment & rider earnings released.</Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        <AppButton title="Back to Food" variant="secondary" onPress={() => navigation.popToTop()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  miss: { color: colors.textMuted, margin: spacing.lg },
  card: { padding: spacing.lg, gap: spacing.md },
  phase: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
  id: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  total: { fontSize: 22, fontWeight: '800', color: colors.primary },
  waiting: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  step: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderRadius: 12 },
  stepCurrent: { backgroundColor: colors.goldTint },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: colors.borderSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepTitle: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  stepTitleOn: { color: colors.text },
  stepSub: { marginTop: 4, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  confirmBtn: { marginTop: spacing.md },
  confirmed: {
    marginTop: spacing.sm,
    color: colors.success,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: { padding: spacing.lg },
  riderBlock: { marginTop: spacing.md, gap: spacing.sm },
  riderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
});
