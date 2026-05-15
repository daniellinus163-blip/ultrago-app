import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { colors, gradients } from '../../theme/colors';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../../theme/spacing';

/** Shown while Firestore profile is fetched for a signed-in user (Phase 1 protected routing). */
export function ProfileGateScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={gradients.screenGold} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color={colors.textOnGold} />
      <Text style={styles.hint}>Loading your profile…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  hint: {
    marginTop: spacing.lg,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
