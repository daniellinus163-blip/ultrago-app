import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
};

/** Phase 7 — consistent loading / error / empty shells for Firestore screens. */
export function AsyncState({ loading, error, empty, emptyMessage, onRetry, children }: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTxt}>Loading from Firebase…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Could not load data</Text>
        <Text style={styles.errorBody}>{error}</Text>
        {onRetry ? (
          <Pressable style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{emptyMessage ?? 'Nothing here yet.'}</Text>
        {onRetry ? (
          <Pressable style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryTxt}>Refresh</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingTxt: { color: colors.textMuted, fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  errorBody: { color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  empty: { color: colors.textMuted, textAlign: 'center', lineHeight: 22, fontSize: 15 },
  retryBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryTxt: { color: colors.textOnPrimary, fontWeight: '800' },
});
