import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AsyncState } from '../../components/ui/AsyncState';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeCustomerFoodHistory,
  subscribeRiderDeliveryHistory,
  type DeliveryHistoryEntry,
} from '../../services/food/deliveryHistory';
import { subscribeRideHistory } from '../../services/rides/tripHistory';
import type { Ride, RideStatus } from '../../types/ride';
import { firebaseErrorMessage } from '../../utils/firebaseErrorMessage';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type TabKey = 'rides' | 'deliveries';

function badgeStyle(status: RideStatus | string) {
  if (status === 'completed' || status === 'delivered') {
    return { backgroundColor: 'rgba(74, 222, 128, 0.18)' };
  }
  if (status === 'cancelled') {
    return { backgroundColor: 'rgba(248, 113, 113, 0.15)' };
  }
  return { backgroundColor: colors.goldTintStrong };
}

export function TripHistoryScreen() {
  const { user, profile } = useAuth();
  const role = profile?.appRole ?? 'customer';

  const [tab, setTab] = useState<TabKey>('rides');
  const [rides, setRides] = useState<Ride[]>([]);
  const [foodOrders, setFoodOrders] = useState<DeliveryHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const rideMode = role === 'driver' ? 'driver' : 'rider';
  const showFoodTab = role === 'customer' || role === 'delivery_rider';

  const rideLabel = role === 'driver' ? 'Trips you drove' : 'Your rides';
  const foodLabel = role === 'delivery_rider' ? 'Deliveries you ran' : 'Food orders';

  useEffect(() => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);

    const unsubRide = subscribeRideHistory(
      user.uid,
      rideMode,
      (rows) => {
        setRides(rows);
        setLoading(false);
        setRefreshing(false);
      },
      (msg) => {
        setError(firebaseErrorMessage(new Error(msg)));
        setLoading(false);
        setRefreshing(false);
      },
    );

    let unsubFood: (() => void) | undefined;
    if (showFoodTab) {
      const onFood = (rows: DeliveryHistoryEntry[]) => {
        setFoodOrders(rows);
        setLoading(false);
        setRefreshing(false);
      };
      const onFoodErr = (msg: string) => {
        setError(firebaseErrorMessage(new Error(msg)));
        setLoading(false);
        setRefreshing(false);
      };
      unsubFood =
        role === 'delivery_rider'
          ? subscribeRiderDeliveryHistory(user.uid, onFood, onFoodErr)
          : subscribeCustomerFoodHistory(user.uid, onFood, onFoodErr);
    }

    return () => {
      unsubRide();
      unsubFood?.();
    };
  }, [user, rideMode, role, showFoodTab]);

  const activeList = tab === 'rides' ? rides : foodOrders;
  const isEmpty = activeList.length === 0;

  const emptyMessage = useMemo(() => {
    if (tab === 'rides') {
      return role === 'driver'
        ? 'No completed trips yet — accept rides from the Drive tab.'
        : 'No rides yet — request one from the Ride tab.';
    }
    return role === 'delivery_rider'
      ? 'No deliveries yet — accept orders from the Delivery tab.'
      : 'No food orders yet — order from the Food tab.';
  }, [tab, role]);

  function onRefresh() {
    setRefreshing(true);
    setError(null);
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <Screen>
      <Text style={styles.phase}>Phase 7 · Live activity</Text>
      <Text style={styles.sub}>Realtime history from Firebase — no mock trips.</Text>

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('rides')}
          style={[styles.tab, tab === 'rides' && styles.tabOn]}
        >
          <Text style={[styles.tabTxt, tab === 'rides' && styles.tabTxtOn]}>{rideLabel}</Text>
        </Pressable>
        {showFoodTab ? (
          <Pressable
            onPress={() => setTab('deliveries')}
            style={[styles.tab, tab === 'deliveries' && styles.tabOn]}
          >
            <Text style={[styles.tabTxt, tab === 'deliveries' && styles.tabTxtOn]}>{foodLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.listWrap}>
      <AsyncState
        loading={loading && !refreshing && isEmpty}
        error={error}
        empty={!loading && !error && isEmpty}
        emptyMessage={emptyMessage}
        onRetry={onRefresh}
      >
        {tab === 'rides' ? (
          <FlatList
            style={styles.flexList}
            data={rides}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.destinationLabel ?? item.pickupLabel ?? `Trip ${item.id.slice(0, 6)}`}
                  </Text>
                  <View style={[styles.badge, badgeStyle(item.status)]}>
                    <Text style={styles.badgeText}>{item.status.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>Fare · ${item.fare?.toFixed(2) ?? '—'}</Text>
                {item.riderRating != null ? (
                  <Text style={styles.rating}>Rating · {item.riderRating}★</Text>
                ) : null}
              </View>
            )}
          />
        ) : (
          <FlatList
            style={styles.flexList}
            data={foodOrders}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.title} numberOfLines={1}>
                    Order {item.id.slice(-8)}
                  </Text>
                  <View style={[styles.badge, badgeStyle(item.status)]}>
                    <Text style={styles.badgeText}>{item.status.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  Total · ${(item.orderTotal ?? item.subtotal + item.deliveryFee).toFixed(2)}
                </Text>
                {item.deliveryAddressLabel ? (
                  <Text style={styles.meta} numberOfLines={2}>
                    {item.deliveryAddressLabel}
                  </Text>
                ) : null}
              </View>
            )}
          />
        )}
      </AsyncState>
      </View>
    </Screen>
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
  },
  sub: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabOn: {
    borderColor: colors.primary,
    backgroundColor: colors.goldTintStrong,
  },
  tabTxt: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  tabTxtOn: { color: colors.text, fontWeight: '800' },
  listWrap: { flex: 1 },
  flexList: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
  card: {
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  title: { fontWeight: '800', color: colors.text, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  meta: { marginTop: spacing.xs, color: colors.textMuted },
  rating: { marginTop: spacing.xs, color: colors.primary, fontWeight: '700', fontSize: 14 },
});
