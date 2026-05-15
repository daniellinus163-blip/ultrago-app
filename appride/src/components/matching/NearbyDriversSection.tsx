import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PartnerProfileCard } from '../partner/PartnerProfileCard';
import type { NearbyPartner } from '../../types/partner';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatDistanceKm } from '../../utils/rideMatchingGeo';

type Props = {
  partners: NearbyPartner[];
};

/** Phase 4 — real online drivers from Firebase (shown on Ride home). */
export function NearbyDriversSection({ partners }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Live drivers nearby</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>Firebase · Phase 4</Text>
        </View>
      </View>
      <Text style={styles.sub}>
        Only real signed-in drivers who are online appear here — no demo pins.
      </Text>
      {partners.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No drivers online in your area</Text>
          <Text style={styles.emptyBody}>
            Ask a friend to sign up as Driver, open the Drive tab, and turn the Online switch on.
            Then pull down to refresh this list.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {partners.map((p) => (
            <View key={p.uid} style={styles.cardWrap}>
              <PartnerProfileCard
                profile={p}
                subtitle={`${formatDistanceKm(p.distanceKm)} away · live GPS`}
                compact
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.goldTintStrong,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sub: {
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  emptyBox: {
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  cardWrap: {
    width: 300,
  },
});
