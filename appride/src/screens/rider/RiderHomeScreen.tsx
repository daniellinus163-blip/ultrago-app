import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RideMapView } from '../../components/maps/RideMapView';
import { HomeBookingSheet } from '../../components/rider/HomeBookingSheet';
import { RiderBookingFlowPanel } from '../../components/rider/RiderBookingFlowPanel';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { useLocalRideStatusNotifications } from '../../hooks/useLocalRideStatusNotifications';
import { LiveMatchingBanner } from '../../components/matching/LiveMatchingBanner';
import { subscribeNearbyDrivers } from '../../services/matching/nearbyPartners';
import { startAutoSimulatedDriverFlow } from '../../services/rides/demoSimulatedDriverFlow';
import { subscribeToRide } from '../../services/rides/rideSubscriptions';
import { useRideStore } from '../../store/rideStore';
import type { GeoPoint, LatLng } from '../../types/geo';
import type { Ride } from '../../types/ride';
import type { RideServiceCategory } from '../../types/rideServiceCategory';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { NearbyPartner } from '../../types/partner';
import { resolveLocationLabel } from '../../utils/locationLabel';
import { NEARBY_DRIVER_DISPLAY_RADIUS_KM } from '../../utils/rideMatchingGeo';

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

/** Street-level zoom when centering on the rider (tighter = closer street view). */
const LOCATE_LAT_DELTA = 0.0028;

/** If map center drifts farther than this from GPS (degrees ≈ few hundred m), stop auto-follow. */
const MANUAL_PAN_THRESHOLD = 0.0018;

const SHEET_PEEK = 216;
const FLOW_SHEET = 300;

function demoDestination(from: LatLng): GeoPoint {
  return {
    latitude: from.latitude + 0.028,
    longitude: from.longitude + 0.018,
    address: 'Demo destination',
  };
}

function regionForUser(loc: LatLng): Region {
  const { width, height } = Dimensions.get('window');
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    latitudeDelta: LOCATE_LAT_DELTA,
    longitudeDelta: LOCATE_LAT_DELTA * (width / Math.max(height, 1)),
  };
}

export function RiderHomeScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const ignoreRegionEvent = useRef(false);
  const areaFitDone = useRef(false);
  const userLocationRef = useRef<LatLng | null>(null);
  const { user, profile } = useAuth();
  const riderTrackedRideId = useRideStore((s) => s.riderTrackedRideId);
  const setRiderTrackedRideId = useRideStore((s) => s.setRiderTrackedRideId);
  const setActiveRide = useRideStore((s) => s.setActiveRide);
  const clearRiderTracking = useRideStore((s) => s.clearRiderTracking);

  const simStopRef = useRef<(() => void) | null>(null);
  const simStartedForRideId = useRef<string | null>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [rideCategory, setRideCategory] = useState<RideServiceCategory>('economy');
  const [permissionNote, setPermissionNote] = useState<string | null>(null);
  const [liveRide, setLiveRide] = useState<Ride | null>(null);
  /** Phase 4 — real online drivers from Firebase within radius. */
  const [nearbyPartners, setNearbyPartners] = useState<NearbyPartner[]>([]);
  /** When true, map animates to GPS as you move (disabled after you pan away, or during active trip). */
  const [followUser, setFollowUser] = useState(true);
  const [mapGesturesEnabled, setMapGesturesEnabled] = useState(true);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  userLocationRef.current = userLocation;

  const pickup: GeoPoint | null = userLocation
    ? { ...userLocation, address: locationLabel ?? 'Your location' }
    : null;

  const visibleNearbyPartners = useMemo(() => {
    if (!user?.uid) {
      return nearbyPartners;
    }
    return nearbyPartners.filter((p) => p.uid !== user.uid);
  }, [nearbyPartners, user?.uid]);

  const liveDriverPinsNearby = useMemo(() => {
    if (riderTrackedRideId) {
      return [];
    }
    return visibleNearbyPartners.map((p) => ({ id: p.uid, coordinate: p.coordinate }));
  }, [visibleNearbyPartners, riderTrackedRideId]);

  const demandDriverSignal = nearbyPartners.length;

  const routeLine = useMemo(() => {
    if (liveRide?.pickupLocation && liveRide.destination) {
      return { start: liveRide.pickupLocation, end: liveRide.destination };
    }
    if (userLocation && destination) {
      return {
        start: userLocation,
        end: { latitude: destination.latitude, longitude: destination.longitude },
      };
    }
    return null;
  }, [liveRide, userLocation, destination]);

  const assignedDriverLocation = useMemo(() => {
    if (!liveRide?.driverLocation) {
      return null;
    }
    return {
      latitude: liveRide.driverLocation.latitude,
      longitude: liveRide.driverLocation.longitude,
    };
  }, [liveRide?.driverLocation]);

  useLocalRideStatusNotifications(liveRide, user?.uid);

  const bottomPad = riderTrackedRideId ? FLOW_SHEET : SHEET_PEEK;

  const centerOnUser = useCallback(() => {
    if (!mapRef.current || !userLocationRef.current) {
      return;
    }
    const r = regionForUser(userLocationRef.current);
    ignoreRegionEvent.current = true;
    mapRef.current.animateToRegion(r, 420);
    setRegion(r);
  }, []);

  const fitLocalActivityArea = useCallback(() => {
    if (!mapRef.current || !userLocationRef.current || riderTrackedRideId) {
      return;
    }
    const ul = userLocationRef.current;
    const coords: LatLng[] = [ul];
    for (const p of visibleNearbyPartners) {
      coords.push(p.coordinate);
    }
    ignoreRegionEvent.current = true;
    if (coords.length === 1) {
      centerOnUser();
      return;
    }
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: {
        top: insets.top + 130,
        right: 44,
        bottom: bottomPad + insets.bottom + 36,
        left: 44,
      },
      animated: true,
    });
  }, [visibleNearbyPartners, riderTrackedRideId, insets.top, insets.bottom, bottomPad, centerOnUser]);

  const fitRoute = useCallback(() => {
    if (!mapRef.current) {
      return;
    }
    const ul = userLocationRef.current;
    const coords: LatLng[] = [];
    if (riderTrackedRideId && liveRide) {
      coords.push({
        latitude: liveRide.pickupLocation.latitude,
        longitude: liveRide.pickupLocation.longitude,
      });
      if (liveRide.driverLocation) {
        coords.push({
          latitude: liveRide.driverLocation.latitude,
          longitude: liveRide.driverLocation.longitude,
        });
      }
      coords.push({
        latitude: liveRide.destination.latitude,
        longitude: liveRide.destination.longitude,
      });
    } else if (ul && destination) {
      coords.push(ul, {
        latitude: destination.latitude,
        longitude: destination.longitude,
      });
    }
    if (coords.length < 2) {
      return;
    }
    ignoreRegionEvent.current = true;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: {
        top: insets.top + 100,
        right: 36,
        bottom: bottomPad + insets.bottom + 24,
        left: 36,
      },
      animated: true,
    });
  }, [destination, liveRide, riderTrackedRideId, insets.top, insets.bottom, bottomPad]);

  const onRegionChangeComplete = useCallback(
    (r: Region) => {
      if (ignoreRegionEvent.current) {
        ignoreRegionEvent.current = false;
        setRegion(r);
        return;
      }
      setRegion(r);
      const ul = userLocationRef.current;
      if (ul && !riderTrackedRideId) {
        const d = Math.hypot(r.latitude - ul.latitude, r.longitude - ul.longitude);
        if (d > MANUAL_PAN_THRESHOLD) {
          setFollowUser(false);
        }
      }
    },
    [riderTrackedRideId],
  );

  useEffect(() => {
    let cancelled = false;
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) {
        return;
      }
      if (status !== 'granted') {
        setPermissionNote('Location permission is required to center the map.');
        return;
      }
      setPermissionNote(null);

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (cancelled) {
        return;
      }
      const coords: LatLng = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setUserLocation(coords);
      setFollowUser(true);
      areaFitDone.current = false;
      const r0 = regionForUser(coords);
      ignoreRegionEvent.current = true;
      setRegion(r0);
      void resolveLocationLabel(coords.latitude, coords.longitude).then((label) => {
        if (!cancelled) {
          setLocationLabel(label);
        }
      });

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 6,
          timeInterval: 2200,
        },
        (p) => {
          if (!cancelled) {
            const next = {
              latitude: p.coords.latitude,
              longitude: p.coords.longitude,
            };
            setUserLocation(next);
            void resolveLocationLabel(next.latitude, next.longitude).then((label) => {
              if (!cancelled) {
                setLocationLabel(label);
              }
            });
          }
        },
      );
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    if (userLocation && destination === null) {
      setDestination(demoDestination(userLocation));
    }
  }, [userLocation, destination]);

  useEffect(() => {
    fitRoute();
  }, [fitRoute]);

  useEffect(() => {
    if (!userLocation || !followUser || riderTrackedRideId) {
      return;
    }
    const r = regionForUser(userLocation);
    ignoreRegionEvent.current = true;
    mapRef.current?.animateToRegion(r, 380);
    setRegion(r);
  }, [userLocation, followUser, riderTrackedRideId]);

  useEffect(() => {
    return () => {
      simStopRef.current?.();
      simStopRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!riderTrackedRideId) {
      simStopRef.current?.();
      simStopRef.current = null;
      simStartedForRideId.current = null;
      return;
    }
    if (!liveRide || liveRide.id !== riderTrackedRideId) {
      return;
    }
    if (liveRide.status !== 'searching') {
      return;
    }
    if (process.env.EXPO_PUBLIC_AUTO_SIMULATE_DRIVER !== '1') {
      return;
    }
    if (simStartedForRideId.current === riderTrackedRideId) {
      return;
    }
    simStartedForRideId.current = riderTrackedRideId;
    simStopRef.current?.();
    simStopRef.current = startAutoSimulatedDriverFlow(
      riderTrackedRideId,
      liveRide.pickupLocation,
      liveRide.destination,
    );
  }, [riderTrackedRideId, liveRide?.id, liveRide?.status]);

  useEffect(() => {
    if (!riderTrackedRideId) {
      setLiveRide(null);
      setActiveRide(null);
      return;
    }
    const unsub = subscribeToRide(riderTrackedRideId, (ride) => {
      setLiveRide(ride);
      setActiveRide(ride);
    });
    return unsub;
  }, [riderTrackedRideId, setActiveRide]);

  useEffect(() => {
    if (riderTrackedRideId) {
      setNearbyPartners([]);
      return;
    }
    return subscribeNearbyDrivers(userLocation, NEARBY_DRIVER_DISPLAY_RADIUS_KM, setNearbyPartners);
  }, [riderTrackedRideId, userLocation]);

  useEffect(() => {
    if (!userLocation || riderTrackedRideId || !followUser) {
      return;
    }
    if (visibleNearbyPartners.length > 0 && !areaFitDone.current) {
      areaFitDone.current = true;
      fitLocalActivityArea();
    }
  }, [userLocation, visibleNearbyPartners.length, riderTrackedRideId, followUser, fitLocalActivityArea]);

  if (!user) {
    return null;
  }

  const fabBottom = bottomPad + insets.bottom + 14;

  return (
    <Screen safe={false} style={styles.flex}>
      <View style={styles.mapWrap}>
        <RideMapView
          ref={mapRef}
          region={region}
          userLocation={userLocation}
          userLocationLabel={locationLabel ?? undefined}
          showActivityArea={!riderTrackedRideId && Boolean(userLocation)}
          liveDriverPins={riderTrackedRideId ? [] : liveDriverPinsNearby}
          assignedDriverLocation={assignedDriverLocation}
          routeLine={routeLine}
          onRegionChangeComplete={onRegionChangeComplete}
          scrollEnabled={mapGesturesEnabled}
          zoomEnabled={mapGesturesEnabled}
        />
        <View style={[styles.banner, { top: insets.top + spacing.sm }]}>
          <Text style={styles.bannerTitle}>UltraGo · Ride matching</Text>
          {permissionNote ? <Text style={styles.bannerSub}>{permissionNote}</Text> : null}
          {!permissionNote && userLocation ? (
            <View style={styles.locationPill}>
              <Ionicons name="location" size={16} color={colors.primaryDark} />
              <Text style={styles.locationPillTxt} numberOfLines={2}>
                {locationLabel ?? 'Locating you…'}
              </Text>
            </View>
          ) : null}
          {!riderTrackedRideId && userLocation ? (
            <LiveMatchingBanner
              onlineDriverCount={visibleNearbyPartners.length}
              roleLabel={profile?.appRole ?? 'customer'}
            />
          ) : null}
          {liveRide && user && liveRide.userId === user.uid && riderTrackedRideId ? (
            <View style={styles.livePill}>
              <Text style={styles.livePillTxt}>{liveRide.status.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
          {!riderTrackedRideId ? (
            <Text style={styles.bannerSub}>
              {followUser
                ? visibleNearbyPartners.length > 0
                  ? 'Zoomed to your area — gold dots are drivers moving live on the map.'
                  : 'Map follows you — pan to explore, or tap the arrow to re-center.'
                : 'Pan mode — tap the arrow to snap back to your live location.'}
            </Text>
          ) : null}
        </View>
        {!permissionNote && userLocation ? (
          <View style={[styles.fabCol, { bottom: fabBottom }]} pointerEvents="box-none">
            <Pressable
              accessibilityLabel="Center map on my location"
              onPress={() => {
                setFollowUser(true);
                areaFitDone.current = false;
                if (visibleNearbyPartners.length > 0) {
                  fitLocalActivityArea();
                } else {
                  centerOnUser();
                }
              }}
              style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            >
              <Ionicons name="navigate" size={22} color={colors.textOnPrimary} />
            </Pressable>
            {!followUser && !riderTrackedRideId ? (
              <View style={styles.fabHint}>
                <Text style={styles.fabHintTxt}>Live</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {pickup && destination && !riderTrackedRideId ? (
          <HomeBookingSheet
            bottomInset={insets.bottom}
            riderId={user.uid}
            pickup={pickup}
            destination={destination}
            rideCategory={rideCategory}
            onRideCategoryChange={setRideCategory}
            onDestinationChange={setDestination}
            blocked={false}
            blockedMessage=""
            onRideCreated={(id) => setRiderTrackedRideId(id)}
            nearbyPartners={visibleNearbyPartners}
            nearbyLiveDriverCount={demandDriverSignal}
            onMapGestureLock={(locked) => setMapGesturesEnabled(!locked)}
          />
        ) : null}
      </View>
      {riderTrackedRideId && liveRide ? (
        <RiderBookingFlowPanel
          ride={liveRide}
          riderLocation={userLocation}
          onClearTracking={() => clearRiderTracking()}
        />
      ) : null}
      {!(pickup && destination) && !riderTrackedRideId ? (
        <View style={[styles.fallbackSheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Text style={styles.wait}>Fetching GPS… reopen this tab after granting permission.</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    backgroundColor: colors.background,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  banner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 4,
    backgroundColor: colors.glass,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bannerTitle: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 18,
  },
  bannerSub: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  locationPillTxt: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  livePill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.goldTintStrong,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  livePillTxt: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fabCol: {
    position: 'absolute',
    right: spacing.md,
    alignItems: 'flex-end',
    zIndex: 6,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryBright,
    shadowColor: colors.glow,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  fabPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  fabHint: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  fabHintTxt: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  fallbackSheet: {
    backgroundColor: colors.surface,
  },
  wait: {
    padding: spacing.lg,
    color: colors.textMuted,
  },
});
