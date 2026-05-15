import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../ui/AppButton';
import type { Ride, RideStatus } from '../../types/ride';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const LABELS: Record<RideStatus, string> = {
  requested: 'Requested',
  searching: 'Finding a driver…',
  driver_accepted: 'Driver accepted',
  driver_arriving: 'Driver is arriving',
  in_progress: 'Trip in progress',
  completed: 'Trip completed',
  cancelled: 'Cancelled',
};

type Props = {
  ride: Ride;
  onDismiss?: () => void;
};

/**
 * Phase 9 + 12: readable status + subtle pulse while we search for a driver.
 */
export function RideLiveBanner({ ride, onDismiss }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  const isSearching = ride.status === 'searching';

  useEffect(() => {
    if (!isSearching) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isSearching, pulse]);

  const title = useMemo(() => LABELS[ride.status] ?? ride.status, [ride.status]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.inner, isSearching && { transform: [{ scale: pulse }] }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Ride ID: {ride.id.slice(0, 8)}…</Text>
        {ride.fare != null ? <Text style={styles.sub}>Fare estimate: ${ride.fare.toFixed(2)}</Text> : null}
      </Animated.View>
      {ride.status === 'completed' && onDismiss ? (
        <AppButton title="Done" variant="secondary" onPress={onDismiss} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
  },
  inner: {
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 15,
  },
  sub: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
  },
  btn: {
    marginTop: spacing.sm,
  },
});
