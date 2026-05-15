import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'Referral'>;

export function ReferralScreen({}: Props) {
  const { user } = useAuth();
  const code = useMemo(() => {
    const raw = user?.uid?.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() ?? 'GUEST';
    return `ULTRAGO-${raw}`;
  }, [user?.uid]);

  async function onShare() {
    try {
      await Share.share({
        message: `Join me on UltraGo — use my code ${code} for perks.\nhttps://ultrago.example/referral`,
        title: 'UltraGo referral',
      });
    } catch {
      Alert.alert('Referral code', code);
    }
  }

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.label}>Your referral code</Text>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.body}>
          Share UltraGo with friends. When they ride or order food, you both unlock streak rewards (coming in Phase 7).
        </Text>
        <AppButton title="Share code" onPress={() => void onShare()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  label: { fontWeight: '700', color: colors.textMuted, fontSize: 13, textTransform: 'uppercase' },
  code: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.primary,
  },
  body: { color: colors.textMuted, lineHeight: 22, fontSize: 15 },
});
