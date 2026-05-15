import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../ui/AppButton';
import type { PartnerRequestNotification } from '../../types/partnerRequestNotification';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  notification: PartnerRequestNotification;
  busy?: boolean;
  onAccept: () => void;
  onReject: () => void;
};

export function PartnerRequestNotificationCard({ notification, busy, onAccept, onReject }: Props) {
  const kindLabel = notification.kind === 'ride' ? 'Ride request' : 'Food delivery';
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeTxt}>Phase 5 · Live request</Text>
      </View>
      <Text style={styles.title}>{kindLabel}</Text>
      {notification.customerDisplayName ? (
        <Text style={styles.meta}>Customer · {notification.customerDisplayName}</Text>
      ) : null}
      {notification.locationLabel ? <Text style={styles.meta}>{notification.locationLabel}</Text> : null}
      <Text style={styles.meta}>Type · {notification.orderTypeLabel.replace(/_/g, ' ')}</Text>
      <Text style={styles.earn}>
        Est. earnings · ${notification.estimatedEarnings.toFixed(2)} {notification.currency}
      </Text>
      <View style={styles.actions}>
        <AppButton title="Reject" variant="secondary" disabled={busy} onPress={onReject} style={styles.btn} />
        <AppButton title="Accept" disabled={busy} onPress={onAccept} style={styles.btn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.goldTintStrong,
    marginBottom: spacing.sm,
  },
  badgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
  },
  earn: {
    marginTop: spacing.sm,
    fontWeight: '800',
    color: colors.primary,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    flex: 1,
  },
});
