import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Location from 'expo-location';

import { PartnerRequestNotificationCard } from '../../components/partner/PartnerRequestNotificationCard';
import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { usePartnerRequestLocalAlerts } from '../../hooks/usePartnerRequestLocalAlerts';
import { usePartnerLocationHeartbeat } from '../../hooks/usePartnerLocationHeartbeat';
import {
  acceptFoodDeliveryPartnerRequest,
  rejectPartnerRequest,
  subscribePartnerRequestNotifications,
} from '../../services/notifications/partnerRequestNotifications';
import { markFoodOrderDeliveredByRider } from '../../services/food/completeFoodDelivery';
import { subscribeOpenFoodOrdersForDelivery } from '../../services/delivery/deliveryOrderSubscriptions';
import {
  setDeliveryRiderOffline,
  setDeliveryRiderOnline,
  updateDeliveryRiderLocation,
} from '../../services/delivery/deliveryRiderPresence';
import { updateFoodOrderInFirestore } from '../../services/food/foodOrdersFirestore';
import type { PartnerRequestNotification } from '../../types/partnerRequestNotification';
import type { FoodOrder } from '../../types/food';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function DeliveryDeskScreen() {
  const { user, profile } = useAuth();
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [firestoreOrders, setFirestoreOrders] = useState<FoodOrder[]>([]);
  const [requestNotifications, setRequestNotifications] = useState<PartnerRequestNotification[]>([]);

  const isRider = profile?.appRole === 'delivery_rider';

  usePartnerRequestLocalAlerts(requestNotifications);

  usePartnerLocationHeartbeat(online, async (coords) => {
    if (!user) {
      return;
    }
    await updateDeliveryRiderLocation(user.uid, coords);
  });

  useEffect(() => {
    if (!isRider) {
      return;
    }
    return subscribeOpenFoodOrdersForDelivery(setFirestoreOrders);
  }, [isRider]);

  useEffect(() => {
    if (!user || !online) {
      setRequestNotifications([]);
      return;
    }
    return subscribePartnerRequestNotifications(user.uid, setRequestNotifications);
  }, [user, online]);

  const queue = useMemo(() => {
    return firestoreOrders.filter(
      (o) =>
        (o.status === 'received' || o.status === 'preparing' || o.status === 'out_for_delivery') &&
        (o.deliveryRiderId == null || o.deliveryRiderId === user?.uid),
    );
  }, [firestoreOrders, user?.uid]);

  async function onToggle(next: boolean) {
    if (!user) {
      return;
    }
    setBusy(true);
    try {
      if (next) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Allow location while going online as a delivery rider.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await setDeliveryRiderOnline(user.uid, {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setOnline(true);
      } else {
        await setDeliveryRiderOffline(user.uid);
        setOnline(false);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update online status.';
      Alert.alert('Delivery status', message);
    } finally {
      setBusy(false);
    }
  }

  const accept = useCallback(
    async (id: string) => {
      if (!user) {
        return;
      }
      setBusy(true);
      try {
        await updateFoodOrderInFirestore(id, { deliveryRiderId: user.uid, status: 'out_for_delivery' });
        Alert.alert('Accepted', 'Head to the restaurant for pickup.');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Could not accept order.';
        Alert.alert('Accept failed', message);
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  const acceptNotification = useCallback(
    async (notification: PartnerRequestNotification) => {
      if (!user) {
        return;
      }
      setBusy(true);
      try {
        await acceptFoodDeliveryPartnerRequest(notification, user.uid);
        Alert.alert('Accepted', 'Delivery assigned to you. Pick up and deliver the order.');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Could not accept delivery.';
        Alert.alert('Accept failed', message);
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  const markDelivered = useCallback(async (orderId: string) => {
    setBusy(true);
    try {
      await markFoodOrderDeliveredByRider(orderId);
      Alert.alert('Delivered', 'Waiting for customer confirmation to release your earnings.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not mark delivered.';
      Alert.alert('Update failed', message);
    } finally {
      setBusy(false);
    }
  }, []);

  if (!isRider) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Delivery desk</Text>
          <Text style={styles.sub}>Sign up as a delivery rider to accept food orders from Firebase.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Delivery desk · Phase 7</Text>
          <Text style={styles.sub}>
            Accept/reject live delivery requests. Mark delivered when you drop off — earnings credit after customer confirms.
          </Text>
          {online ? (
            <Text style={styles.liveTxt}>You are LIVE for delivery matching</Text>
          ) : null}
        </View>
        <Switch
          value={online}
          disabled={busy}
          onValueChange={(v) => void onToggle(v)}
          trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
        />
      </View>
      {requestNotifications.length > 0 ? (
        <View style={styles.notifSection}>
          <Text style={styles.notifLabel}>Incoming delivery requests</Text>
          {requestNotifications.map((n) => (
            <PartnerRequestNotificationCard
              key={n.id}
              notification={n}
              busy={busy}
              onAccept={() => void acceptNotification(n)}
              onReject={() => {
                setBusy(true);
                void rejectPartnerRequest(n.id)
                  .catch((e) => Alert.alert('Reject failed', e instanceof Error ? e.message : 'Error'))
                  .finally(() => setBusy(false));
              }}
            />
          ))}
        </View>
      ) : null}
      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {online
              ? 'No open deliveries right now. New orders appear here in realtime.'
              : 'Go online to receive delivery requests.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.id}>Order {item.id.slice(-8)}</Text>
            {item.customerDisplayName ? (
              <Text style={styles.meta}>Customer · {item.customerDisplayName}</Text>
            ) : null}
            <Text style={styles.meta}>Status · {item.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.meta}>Total · ${(item.subtotal + item.deliveryFee).toFixed(2)}</Text>
            {item.deliveryAddressLabel ? <Text style={styles.meta}>{item.deliveryAddressLabel}</Text> : null}
            {(item.status === 'received' || item.status === 'preparing') && item.deliveryRiderId == null ? (
              <AppButton title="Accept delivery" disabled={!online || busy} onPress={() => void accept(item.id)} />
            ) : item.deliveryRiderId === user?.uid && item.status === 'out_for_delivery' ? (
              <AppButton
                title="Mark delivered"
                disabled={busy}
                onPress={() => void markDelivered(item.id)}
              />
            ) : item.deliveryRiderId === user?.uid ? (
              <Text style={styles.you}>
                {item.status === 'delivered'
                  ? 'Awaiting customer confirmation for wallet credit.'
                  : 'You are assigned to this order.'}
              </Text>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  notifSection: { paddingBottom: spacing.sm },
  notifLabel: {
    marginHorizontal: spacing.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  liveTxt: {
    marginTop: spacing.sm,
    fontWeight: '800',
    fontSize: 12,
    color: colors.primaryDark,
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 20 },
  card: {
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  id: { fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, fontSize: 13 },
  you: { color: colors.primary, fontWeight: '700', marginTop: spacing.xs },
});
