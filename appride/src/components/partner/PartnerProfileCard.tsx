import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PartnerPublicProfile } from '../../types/partner';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  profile: PartnerPublicProfile;
  subtitle?: string;
  compact?: boolean;
};

export function PartnerProfileCard({ profile, subtitle, compact }: Props) {
  const stars = Math.round(Math.min(5, Math.max(0, profile.ratingAvg)));

  function onCall() {
    if (!profile.phoneNumber) {
      return;
    }
    const tel = profile.phoneNumber.replace(/\s/g, '');
    void Linking.openURL(`tel:${tel}`);
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {profile.photoUrl ? (
        <Image source={{ uri: profile.photoUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={compact ? 22 : 28} color={colors.primaryDark} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{profile.displayName}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        <View style={styles.row}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Ionicons
                key={n}
                name={n <= stars ? 'star' : 'star-outline'}
                size={14}
                color={colors.primary}
              />
            ))}
          </View>
          <Text style={styles.ratingMeta}>
            {profile.ratingAvg.toFixed(1)}
            {profile.ratingCount > 0 ? ` (${profile.ratingCount})` : ''}
          </Text>
        </View>
        {profile.vehicleLabel ? (
          <Text style={styles.vehicle} numberOfLines={1}>
            {profile.vehicleLabel}
          </Text>
        ) : null}
      </View>
      {profile.phoneNumber ? (
        <Pressable onPress={onCall} style={styles.callBtn} accessibilityLabel="Call partner">
          <Ionicons name="call" size={20} color={colors.textOnPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardCompact: {
    padding: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceElevated,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  ratingMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  vehicle: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
