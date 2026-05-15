import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '../ui/AppButton';
import { PartnerProfileCard } from '../partner/PartnerProfileCard';
import { RideChatPanel } from './RideChatPanel';
import { RideSosBar } from './RideSosBar';
import { useAuth } from '../../context/AuthContext';
import { fetchPartnerPublicProfile } from '../../services/matching/partnerProfiles';
import type { PartnerPublicProfile } from '../../types/partner';
import { simulateDriverAcceptForDev } from '../../services/rides/demoSimulatedDriverFlow';
import { updateRideStatus } from '../../services/rides/rideLifecycle';
import { submitRiderRating } from '../../services/rides/riderRating';
import { useLoyaltyStore } from '../../store/loyaltyStore';
import { colors, gradients } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { LatLng } from '../../types/geo';
import type { Ride } from '../../types/ride';
import { etaMinutesStraightLine, formatEtaMinutes } from '../../utils/rideEta';

type Props = {
  ride: Ride;
  riderLocation: LatLng | null;
  onClearTracking: () => void;
};

function asLatLng(g: { latitude: number; longitude: number }): LatLng {
  return { latitude: g.latitude, longitude: g.longitude };
}

/**
 * Phase 3 booking UI: search → matched → arriving → trip → complete + rating.
 * Works with live Firestore updates; optional auto-sim is configured on the parent.
 */
export function RiderBookingFlowPanel({ ride, riderLocation, onClearTracking }: Props) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [driverProfile, setDriverProfile] = useState<PartnerPublicProfile | null>(null);

  useEffect(() => {
    if (!ride.driverId) {
      setDriverProfile(null);
      return;
    }
    let cancelled = false;
    void fetchPartnerPublicProfile(ride.driverId).then((p) => {
      if (!cancelled) {
        setDriverProfile(p);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ride.driverId]);

  const pickupLL = asLatLng(ride.pickupLocation);
  const destLL = asLatLng(ride.destination);
  const driverLL = ride.driverLocation ? asLatLng(ride.driverLocation) : null;

  const etaPickup = useMemo(() => {
    if (!driverLL) {
      return null;
    }
    return etaMinutesStraightLine(driverLL, pickupLL, 32);
  }, [driverLL, pickupLL]);

  const etaDestination = useMemo(() => {
    if (!driverLL) {
      return null;
    }
    return etaMinutesStraightLine(driverLL, destLL, 32);
  }, [driverLL, destLL]);

  async function onSubmitRating() {
    if (rating < 1) {
      Alert.alert('Rating', 'Tap the stars to choose 1–5.');
      return;
    }
    setRatingBusy(true);
    try {
      await submitRiderRating(ride.id, rating);
      useLoyaltyStore.getState().addTripRatingPoints(ride.id);
      onClearTracking();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save rating.';
      Alert.alert('Rating failed', message);
    } finally {
      setRatingBusy(false);
    }
  }

  async function onDevSkipSearch() {
    if (!riderLocation) {
      Alert.alert('Location', 'Wait for GPS before simulating a match.');
      return;
    }
    try {
      await simulateDriverAcceptForDev(ride.id, riderLocation);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Simulate failed.';
      Alert.alert('Dev simulate', message);
    }
  }

  async function onSimulatePickup() {
    try {
      await updateRideStatus(ride.id, 'in_progress', {});
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update ride.';
      Alert.alert('Trip', message);
    }
  }

  const showSos =
    riderLocation &&
    (ride.status === 'driver_accepted' ||
      ride.status === 'driver_arriving' ||
      ride.status === 'in_progress');

  const showChat =
    ride.status !== 'completed' && ride.status !== 'cancelled' && user;

  return (
    <View style={styles.outer} pointerEvents="box-none">
      <RideChatPanel
        visible={chatOpen}
        rideId={ride.id}
        userId={user?.uid ?? ''}
        displayName={profile?.displayName}
        onClose={() => setChatOpen(false)}
      />
      <View style={styles.sheet}>
        <LinearGradient
          colors={gradients.sheet}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.accentLine} />

        <View style={[styles.padBottom, { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.sm) }]}>
          {showChat ? (
            <Pressable onPress={() => setChatOpen(true)} style={styles.chatBtn}>
              <Text style={styles.chatBtnTxt}>Message driver</Text>
            </Pressable>
          ) : null}
          {showSos && riderLocation ? (
            <RideSosBar latitude={riderLocation.latitude} longitude={riderLocation.longitude} />
          ) : null}
          {ride.status === 'searching' || ride.status === 'requested' ? (
            <View style={styles.block}>
              <View style={styles.pulseRow}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
              <Text style={styles.title}>Finding your driver</Text>
              <Text style={styles.sub}>
                Matching you with nearby partners — fare locked at ${ride.fare?.toFixed(2) ?? '—'}.
              </Text>
              {ride.destinationLabel ? (
                <Text style={styles.destHint} numberOfLines={2}>
                  To {ride.destinationLabel}
                </Text>
              ) : null}
              {__DEV__ ? (
                <AppButton title="Dev: simulate driver match" variant="secondary" onPress={onDevSkipSearch} />
              ) : null}
            </View>
          ) : null}

          {ride.status === 'driver_accepted' ? (
            <View style={styles.block}>
              {driverProfile ? (
                <PartnerProfileCard profile={driverProfile} subtitle="Your driver" />
              ) : (
                <View style={styles.iconCircle}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
                </View>
              )}
              <Text style={styles.title}>Driver matched</Text>
              <Text style={styles.sub}>Your partner is heading to the pickup point.</Text>
              {etaPickup != null ? (
                <Text style={styles.eta}>Pickup ETA · {formatEtaMinutes(etaPickup)}</Text>
              ) : null}
              {ride.fare != null ? <Text style={styles.fare}>${ride.fare.toFixed(2)} estimated</Text> : null}
              {__DEV__ ? (
                <AppButton title="Dev: start trip (picked up)" variant="secondary" onPress={onSimulatePickup} />
              ) : null}
            </View>
          ) : null}

          {ride.status === 'driver_arriving' ? (
            <View style={styles.block}>
              {driverProfile ? (
                <PartnerProfileCard profile={driverProfile} subtitle="Arriving at pickup" compact />
              ) : (
                <View style={styles.iconCircle}>
                  <Ionicons name="navigate" size={36} color={colors.accentOrange} />
                </View>
              )}
              <Text style={styles.title}>Arriving now</Text>
              <Text style={styles.sub}>Watch the map — your driver is closing in on the pickup.</Text>
              {etaPickup != null ? (
                <Text style={styles.eta}>Pickup ETA · {formatEtaMinutes(etaPickup)}</Text>
              ) : null}
            </View>
          ) : null}

          {ride.status === 'in_progress' ? (
            <View style={styles.block}>
              {driverProfile ? (
                <PartnerProfileCard profile={driverProfile} subtitle="On trip with you" compact />
              ) : (
                <View style={styles.iconCircle}>
                  <Ionicons name="car-sport" size={36} color={colors.primary} />
                </View>
              )}
              <Text style={styles.title}>On the way</Text>
              <Text style={styles.sub}>Sit back — we will notify you when you arrive.</Text>
              {etaDestination != null ? (
                <Text style={styles.eta}>Drop-off ETA · {formatEtaMinutes(etaDestination)}</Text>
              ) : null}
            </View>
          ) : null}

          {ride.status === 'completed' ? (
            <View style={styles.block}>
              {ride.riderRating != null ? (
                <>
                  <Text style={styles.title}>Thanks for riding</Text>
                  <Text style={styles.sub}>You rated this trip {ride.riderRating}★</Text>
                  <AppButton title="Close" variant="primary" onPress={onClearTracking} />
                </>
              ) : (
                <>
                  <Text style={styles.title}>How was your trip?</Text>
                  <Text style={styles.sub}>Your feedback keeps UltraGo premium for everyone.</Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
                        <Ionicons
                          name={rating >= n ? 'star' : 'star-outline'}
                          size={36}
                          color={rating >= n ? colors.primary : colors.textSubtle}
                        />
                      </Pressable>
                    ))}
                  </View>
                  <AppButton
                    title="Submit rating"
                    loading={ratingBusy}
                    onPress={() => void onSubmitRating()}
                  />
                </>
              )}
            </View>
          ) : null}

          {ride.status === 'cancelled' ? (
            <View style={styles.block}>
              <Text style={styles.title}>Ride cancelled</Text>
              <Text style={styles.sub}>This request is no longer active.</Text>
              <AppButton title="Dismiss" variant="secondary" onPress={onClearTracking} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 28,
    elevation: 28,
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 260,
  },
  padBottom: {
    paddingTop: 0,
  },
  accentLine: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(250, 204, 21, 0.35)',
    marginBottom: spacing.md,
  },
  block: {
    gap: spacing.sm,
  },
  pulseRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.2,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  destHint: {
    fontSize: 14,
    color: colors.textSubtle,
    marginBottom: spacing.sm,
  },
  eta: {
    marginTop: spacing.xs,
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  fare: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  chatBtn: {
    alignSelf: 'stretch',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  chatBtnTxt: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
});
