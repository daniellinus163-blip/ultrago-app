import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

/**
 * Shown when `EXPO_PUBLIC_FIREBASE_*` keys are missing so the app does not crash on launch.
 * (Expo Go otherwise surfaces a generic “Something went wrong”.)
 */
export function SetupRequiredScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Configure Firebase first</Text>
        <Text style={styles.p}>
          The app needs your Firebase web keys in a .env file in the appride folder so it can start
          without crashing.
        </Text>
        <Text style={styles.step}>1. In the appride folder, copy .env.example to .env</Text>
        <Text style={styles.step}>2. Paste your EXPO_PUBLIC_FIREBASE_* values from the Firebase console</Text>
        <Text style={styles.step}>3. Stop Expo (Ctrl+C) and run npm start again</Text>
        <Text style={styles.step}>4. In Expo Go, reload the project (shake device → Reload)</Text>
        <View style={styles.note}>
          <Text style={styles.noteTitle}>Also check</Text>
          <Text style={styles.p}>• Phone and PC on the same Wi‑Fi (or use Expo tunnel mode).</Text>
          <Text style={styles.p}>• Expo Go is updated from the App Store / Play Store.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  p: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  step: {
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 22,
    paddingLeft: spacing.sm,
  },
  note: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.secondary,
  },
  noteTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
