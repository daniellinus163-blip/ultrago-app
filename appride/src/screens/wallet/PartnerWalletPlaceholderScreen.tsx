import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { colors, gradients } from '../../theme/colors';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { spacing } from '../../theme/spacing';

/** Drivers & delivery riders get earnings wallet in Phase 3. */
export function PartnerWalletPlaceholderScreen() {
  const { profile } = useAuth();
  const role = profile?.appRole;

  return (
    <Screen style={{ backgroundColor: 'transparent' }}>
      <LinearGradient colors={gradients.screenGold} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        <Text style={styles.title}>Earnings wallet</Text>
        <Text style={styles.body}>
          {role === 'driver'
            ? 'Driver balance, completed rides, and withdrawals arrive in Phase 3.'
            : 'Delivery earnings, completed orders, and payouts arrive in Phase 3.'}
        </Text>
        <Text style={styles.note}>Customer payment methods are separate from partner payouts.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textOnGold,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  note: {
    marginTop: spacing.lg,
    fontSize: 13,
    color: colors.textSubtle,
    fontWeight: '600',
  },
});
