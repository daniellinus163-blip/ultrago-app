import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  latitude: number;
  longitude: number;
};

/** Default US emergency; replace with localized numbers for other regions. */
const EMERGENCY_URI = 'tel:911';

/**
 * Phase 7 safety strip — call emergency or share coordinates (SMS / apps user picks).
 */
export function RideSosBar({ latitude, longitude }: Props) {
  const coordLine = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  function openSos() {
    Alert.alert('Safety', 'If you feel unsafe, contact local emergency services or share your coordinates.', [
      {
        text: 'Call emergency',
        style: 'destructive',
        onPress: () => {
          void Linking.openURL(EMERGENCY_URI).catch(() => {
            Alert.alert('Unable to dial', 'Use your phone keypad to call local emergency services.');
          });
        },
      },
      {
        text: 'Share location',
        onPress: () => {
          void Share.share({
            message: `UltraGo live GPS: ${coordLine}`,
          }).catch(() => {});
        },
      },
      { text: 'Close', style: 'cancel' },
    ]);
  }

  return (
    <Pressable onPress={openSos} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <Ionicons name="warning" size={18} color={colors.error} />
      <Text style={styles.txt}>SOS · safety options</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.9 },
  txt: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
});
