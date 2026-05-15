import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme/colors';
import { spacing } from './theme/spacing';

type LoadedApp = React.ComponentType;

/**
 * Defers loading the full app so startup errors show in-app instead of Expo Go's blue screen.
 */
export default function AppBoot() {
  const [AppRoot, setAppRoot] = useState<LoadedApp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('./App')
      .then((mod) => {
        if (!cancelled) {
          setAppRoot(() => mod.default);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e);
          setError(message);
          if (__DEV__) {
            console.error('[AppBoot] Failed to load app:', e);
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorTitle}>UltraGo could not start</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Text style={styles.errorHint}>
          Run from the appride folder: npm run start:expo-go{'\n'}
          Phone and PC must be on the same Wi‑Fi. Update Expo Go from the Play Store.
        </Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => {
            setError(null);
            setAppRoot(null);
            void import('./App')
              .then((mod) => setAppRoot(() => mod.default))
              .catch((e: unknown) =>
                setError(e instanceof Error ? e.message : String(e)),
              );
          }}
        >
          <Text style={styles.retryTxt}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!AppRoot) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={styles.bootTxt}>Loading UltraGo…</Text>
      </View>
    );
  }

  return <AppRoot />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    gap: spacing.md,
  },
  bootTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnGold,
  },
  errorWrap: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorBody: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  errorHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  retryTxt: {
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
});
