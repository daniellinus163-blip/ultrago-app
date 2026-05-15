import React, { useEffect, useMemo, useRef, forwardRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors } from '../../theme/colors';
import type { LatLng } from '../../types/geo';
type Props = {
  region: Region;
  userLocation?: LatLng | null;
  /** Shown on the user pin and map callout. */
  userLocationLabel?: string;
  /** Draw a soft radius around the rider to show the active area. */
  showActivityArea?: boolean;
  /** Real online drivers from Firestore `drivers` collection (Phase 4). */
  liveDriverPins?: { id: string; coordinate: LatLng }[];
  /** Matched driver position from Firestore (Phase 3+). */
  assignedDriverLocation?: LatLng | null;
  /** Straight-line preview (request flow) or active ride path from Firestore. */
  routeLine?: { start: LatLng; end: LatLng } | null;
  /** Called when user stops dragging the map — parent can sync `region` for realtime-ready flow. */
  onRegionChangeComplete?: (r: Region) => void;
  /** Disable while the booking sheet is being dragged so the map does not pan instead. */
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
};

function PulseDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  return (
    <Animated.View style={{ opacity: pulse, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: color,
          borderWidth: 3,
          borderColor: '#fff',
        }}
      />
    </Animated.View>
  );
}

function DriverPulse({ color }: { color: string }) {
  const s = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(s, { toValue: 0.55, duration: 1400, useNativeDriver: true }),
        Animated.timing(s, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [s]);
  return (
    <Animated.View style={{ opacity: s }}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#fff',
        }}
      />
    </Animated.View>
  );
}

/**
 * Thin wrapper so map styling/props stay consistent across rider + driver screens.
 */
export const RideMapView = forwardRef<MapView, Props>(function RideMapView(
  {
    region,
    userLocation,
    userLocationLabel,
    showActivityArea,
    liveDriverPins,
    assignedDriverLocation,
    routeLine,
    onRegionChangeComplete,
    scrollEnabled = true,
    zoomEnabled = true,
  },
  ref,
) {
  const routeCoords = useMemo(() => {
    if (!routeLine) {
      return null;
    }
    return [routeLine.start, routeLine.end];
  }, [routeLine]);

  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      region={region}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass
      scrollEnabled={scrollEnabled}
      rotateEnabled={scrollEnabled}
      pitchEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      zoomTapEnabled={zoomEnabled}
      userInterfaceStyle="light"
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {routeCoords ? (
        <Polyline
          coordinates={routeCoords}
          strokeColor={colors.primary}
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
          geodesic
        />
      ) : null}
      {userLocation && showActivityArea ? (
        <Circle
          center={userLocation}
          radius={650}
          strokeColor="rgba(212, 175, 55, 0.55)"
          fillColor="rgba(212, 175, 55, 0.12)"
          strokeWidth={2}
        />
      ) : null}
      {userLocation ? (
        <Marker
          coordinate={userLocation}
          title="You are here"
          description={userLocationLabel}
          tracksViewChanges={false}
        >
          <PulseDot color={colors.primary} />
        </Marker>
      ) : null}
      {routeLine ? (
        <Marker coordinate={routeLine.end} title="Destination" tracksViewChanges={false}>
          <View style={styles.destPin}>
            <View style={styles.destDot} />
          </View>
        </Marker>
      ) : null}
      {assignedDriverLocation ? (
        <Marker coordinate={assignedDriverLocation} title="Your driver" tracksViewChanges>
          <DriverPulse color={colors.accentOrange} />
        </Marker>
      ) : null}
      {(liveDriverPins ?? []).map((d) => (
        <Marker
          key={d.id}
          coordinate={d.coordinate}
          title="Driver nearby"
          description="Live position · moves as they drive"
          tracksViewChanges={false}
        >
          <DriverPulse color={colors.primaryDark} />
        </Marker>
      ))}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: { flex: 1 },
  destPin: {
    alignItems: 'center',
  },
  destDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#fff',
  },
});
