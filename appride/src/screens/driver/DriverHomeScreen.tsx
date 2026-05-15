import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import * as Location from 'expo-location';

import { PartnerRequestNotificationCard } from '../../components/partner/PartnerRequestNotificationCard';
import { AppButton } from '../../components/ui/AppButton';
import { RideChatPanel } from '../../components/rider/RideChatPanel';
import { Screen } from '../../components/ui/Screen';
import { usePartnerRequestLocalAlerts } from '../../hooks/usePartnerRequestLocalAlerts';
import { COLLECTIONS } from '../../constants/firebaseCollections';
import { useAuth } from '../../context/AuthContext';
import { getDb } from '../../services/firebase/firestore';
import { usePartnerLocationHeartbeat } from '../../hooks/usePartnerLocationHeartbeat';
import {
  setDriverOffline,
  setDriverOnline,
  updateDriverPresenceLocation,
} from '../../services/drivers/driverPresence';
import {
  acceptRidePartnerRequest,
  rejectPartnerRequest,
  subscribePartnerRequestNotifications,
} from '../../services/notifications/partnerRequestNotifications';
import { acceptRideAsDriver } from '../../services/rides/driverRideActions';
import { fetchDriverEarningsTotal } from '../../services/rides/driverEarnings';
import { completeRideWithPartnerEarnings } from '../../services/rides/completeRideWithEarnings';
import { updateRideStatus } from '../../services/rides/rideLifecycle';
import { updateDriverRideLocation } from '../../services/rides/rideDriverTracking';
import { mapDocToRide, subscribeToRide } from '../../services/rides/rideSubscriptions';
import { useRideStore } from '../../store/rideStore';
import type { PartnerRequestNotification } from '../../types/partnerRequestNotification';
import type { Ride, RideStatus } from '../../types/ride';
import type { LatLng } from '../../types/geo';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { filterRidesNearPartner, formatDistanceKm } from '../../utils/rideMatchingGeo';
import { distanceKm } from '../../utils/fareEstimate';

export function DriverHomeScreen() {
  const { user, profile } = useAuth();
  const driverActiveRideId = useRideStore((s) => s.driverActiveRideId);
  const setDriverActiveRideId = useRideStore((s) => s.setDriverActiveRideId);
  const clearDriverActive = useRideStore((s) => s.clearDriverActive);

  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openRides, setOpenRides] = useState<Ride[]>([]);
  const [driverCoords, setDriverCoords] = useState<LatLng | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [driverLiveRide, setDriverLiveRide] = useState<Ride | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [requestNotifications, setRequestNotifications] = useState<PartnerRequestNotification[]>([]);

  usePartnerRequestLocalAlerts(requestNotifications);

  const driverReady = profile?.appRole === 'driver' || Boolean(profile?.driverModeEnabled);

  const nearbyOpenRides = useMemo(() => {
    if (!driverCoords) {
      return openRides;
    }
    return filterRidesNearPartner(driverCoords, openRides);
  }, [openRides, driverCoords]);

  usePartnerLocationHeartbeat(online, async (coords) => {
    if (!user) {
      return;
    }
    setDriverCoords(coords);
    await updateDriverPresenceLocation(user.uid, coords);
  });

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        return;
      }
      void fetchDriverEarningsTotal(user.uid).then(setEarnings);
    }, [user]),
  );

  useEffect(() => {
    if (!user || !online) {
      setRequestNotifications([]);
      return;
    }
    return subscribePartnerRequestNotifications(user.uid, setRequestNotifications);
  }, [user, online]);

  useEffect(() => {
    if (!driverReady || !user) {
      return;
    }
    const db = getDb();
    const q = query(
      collection(db, COLLECTIONS.rides),
      where('status', '==', 'searching'),
      limit(20),
    );
    return onSnapshot(q, (snap) => {
      const rows: Ride[] = snap.docs.map((d) => mapDocToRide(d.id, d.data() as Record<string, unknown>));
      setOpenRides(rows);
    });
  }, [driverReady, user]);

  useEffect(() => {
    if (!driverActiveRideId) {
      setDriverLiveRide(null);
      return;
    }
    return subscribeToRide(driverActiveRideId, setDriverLiveRide);
  }, [driverActiveRideId]);

  async function onToggle(next: boolean) {
    if (!user) {
      return;
    }
    if (!driverReady) {
      Alert.alert('Driver mode off', 'Enable driver mode from the Account tab first.');
      return;
    }
    setBusy(true);
    try {
      if (next) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Allow location while going online as a driver.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        await setDriverOnline(user.uid, coords, {
          displayName: profile?.displayName ?? user.displayName ?? 'Driver',
          phoneNumber: profile?.phoneNumber ?? undefined,
        });
        setDriverCoords(coords);
        setOnline(true);
      } else {
        await setDriverOffline(user.uid);
        setOnline(false);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update online status.';
      Alert.alert('Driver status', message);
    } finally {
      setBusy(false);
    }
  }

  async function onAcceptNotification(notification: PartnerRequestNotification) {
    if (!user) {
      return;
    }
    if (driverActiveRideId) {
      Alert.alert('Active trip', 'Finish your current trip before accepting another.');
      return;
    }
    setBusy(true);
    try {
      await acceptRidePartnerRequest(notification, user.uid);
      setDriverActiveRideId(notification.referenceId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not accept request.';
      Alert.alert('Accept failed', message);
    } finally {
      setBusy(false);
    }
  }

  async function onRejectNotification(notificationId: string) {
    setBusy(true);
    try {
      await rejectPartnerRequest(notificationId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not reject.';
      Alert.alert('Reject failed', message);
    } finally {
      setBusy(false);
    }
  }

  async function onAccept(ride: Ride) {
    if (!user) {
      return;
    }
    if (driverActiveRideId) {
      Alert.alert('Active trip', 'Finish or complete your current trip before accepting another.');
      return;
    }
    setBusy(true);
    try {
      await acceptRideAsDriver(ride.id, user.uid);
      setDriverActiveRideId(ride.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not accept ride.';
      Alert.alert('Accept failed', message);
    } finally {
      setBusy(false);
    }
  }

  async function advance(status: RideStatus) {
    if (!driverLiveRide) {
      return;
    }
    setBusy(true);
    try {
      if (status === 'completed') {
        await completeRideWithPartnerEarnings(driverLiveRide.id);
        clearDriverActive();
        setDriverLiveRide(null);
        if (user) {
          void fetchDriverEarningsTotal(user.uid).then(setEarnings);
        }
      } else {
        await updateRideStatus(driverLiveRide.id, status);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update ride.';
      Alert.alert('Ride update', message);
    } finally {
      setBusy(false);
    }
  }

  const showActiveTrip =
    driverLiveRide &&
    user &&
    driverLiveRide.driverId === user.uid &&
    driverLiveRide.status !== 'completed' &&
    driverLiveRide.status !== 'cancelled';

  useEffect(() => {
    if (!driverActiveRideId || !user) {
      return;
    }
    const rideId = driverActiveRideId;
    let sub: Location.LocationSubscription | undefined;
    let lastWrite = 0;
    (async () => {
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 22,
        },
        (p) => {
          const now = Date.now();
          if (now - lastWrite < 4500) {
            return;
          }
          lastWrite = now;
          void updateDriverRideLocation(rideId, {
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
          });
        },
      );
    })();
    return () => {
      sub?.remove();
    };
  }, [driverActiveRideId, user]);

  if (!driverReady) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Driver tools are paused</Text>
          <Text style={styles.body}>
            Choose Driver when you complete profile, or turn on Driver mode under Account.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <RideChatPanel
        visible={chatOpen && Boolean(driverActiveRideId)}
        rideId={driverActiveRideId ?? ''}
        userId={user?.uid ?? ''}
        displayName={profile?.displayName}
        onClose={() => setChatOpen(false)}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Driver desk · Phase 7</Text>
            <Text style={styles.body}>
              Go online for live ride requests with accept/reject notifications. Earnings credit when you complete a trip.
            </Text>
            {online ? (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeTxt}>You are LIVE — customers can match with you</Text>
              </View>
            ) : null}
            <Text style={styles.earnings}>Wallet balance (confirmed): ${earnings.toFixed(2)}</Text>
          </View>
          <Switch
            value={online}
            disabled={busy}
            onValueChange={(v) => void onToggle(v)}
            trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
          />
        </View>

        {showActiveTrip ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>Your active trip</Text>
            <Text style={styles.meta}>Status: {driverLiveRide.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.meta}>Fare: ${driverLiveRide.fare?.toFixed(2) ?? '—'}</Text>
            <Pressable onPress={() => setChatOpen(true)} style={styles.chatLink}>
              <Text style={styles.chatLinkTxt}>Open trip chat</Text>
            </Pressable>
            {driverLiveRide.status === 'driver_accepted' ? (
              <AppButton
                title="Mark arriving"
                disabled={busy}
                onPress={() => void advance('driver_arriving')}
                style={styles.activeBtn}
              />
            ) : null}
            {driverLiveRide.status === 'driver_arriving' ? (
              <AppButton
                title="Start trip"
                disabled={busy}
                onPress={() => void advance('in_progress')}
                style={styles.activeBtn}
              />
            ) : null}
            {driverLiveRide.status === 'in_progress' ? (
              <AppButton
                title="Complete trip"
                disabled={busy}
                onPress={() => void advance('completed')}
                style={styles.activeBtn}
              />
            ) : null}
          </View>
        ) : null}

        {requestNotifications.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Incoming requests (notifications)</Text>
            {requestNotifications.map((n) => (
              <PartnerRequestNotificationCard
                key={n.id}
                notification={n}
                busy={busy}
                onAccept={() => void onAcceptNotification(n)}
                onReject={() => void onRejectNotification(n.id)}
              />
            ))}
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Open requests near you</Text>
        {!driverCoords && online ? (
          <Text style={styles.hint}>Waiting for GPS to filter nearby pickups…</Text>
        ) : null}
        <FlatList
          scrollEnabled={false}
          data={nearbyOpenRides}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {openRides.length > 0 && driverCoords
                ? 'No searching rides within range — move closer or wait for new requests.'
                : 'No rides in the "searching" state right now.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ride {item.id.slice(0, 6)}…</Text>
              <Text style={styles.meta}>Rider: {item.userId.slice(0, 6)}…</Text>
              <Text style={styles.meta}>Fare est.: ${item.fare?.toFixed(2) ?? '—'}</Text>
              {driverCoords ? (
                <Text style={styles.meta}>
                  Pickup · {formatDistanceKm(distanceKm(driverCoords, item.pickupLocation))} away
                </Text>
              ) : null}
              {item.pickupLabel ? <Text style={styles.meta}>{item.pickupLabel}</Text> : null}
              <AppButton title="Accept ride" onPress={() => void onAccept(item)} style={styles.accept} />
            </View>
          )}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl * 2,
  },
  center: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    lineHeight: 20,
    maxWidth: 280,
  },
  earnings: {
    marginTop: spacing.sm,
    fontWeight: '700',
    color: colors.text,
  },
  liveBadge: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.goldTintStrong,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  liveBadgeTxt: {
    fontWeight: '800',
    fontSize: 12,
    color: colors.primaryDark,
  },
  activeCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  activeTitle: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 16,
  },
  activeBtn: {
    marginTop: spacing.sm,
  },
  chatLink: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatLinkTxt: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  hint: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionLabel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    fontWeight: '700',
    color: colors.text,
  },
  empty: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    color: colors.textMuted,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardTitle: {
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  accept: {
    marginTop: spacing.md,
  },
});
