import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '../../theme/colors';

type Props = { height: number; style?: ViewStyle; width?: number | `${number}%` };

export function Skeleton({ height, width = '100%', style }: Props) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [pulse]);
  return (
    <Animated.View style={[styles.box, { height, width, opacity: pulse }, style]} accessibilityRole="none" />
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
});
