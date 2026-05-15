import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  onlineDriverCount: number;
  roleLabel?: string;
};

export function LiveMatchingBanner({ onlineDriverCount, roleLabel }: Props) {
  return (
    <View style={styles.banner}>
      <Ionicons name="radio" size={18} color={colors.primaryDark} />
      <View style={styles.textCol}>
        <Text style={styles.title}>Real-time matching active</Text>
        <Text style={styles.sub}>
          {onlineDriverCount > 0
            ? `${onlineDriverCount} driver${onlineDriverCount === 1 ? '' : 's'} moving in your area right now — watch the map pins update live.`
            : 'Scanning your area for online drivers — expand the sheet below to book a ride.'}
          {roleLabel ? ` · You: ${roleLabel}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textCol: { flex: 1 },
  title: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
});
