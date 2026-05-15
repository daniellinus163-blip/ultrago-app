import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useWalletStore } from '../../store/walletStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'PromoCodes'>;

export function PromoCodesScreen({}: Props) {
  const applyPromoCode = useWalletStore((s) => s.applyPromoCode);
  const foodPct = useWalletStore((s) => s.foodPromoPercent);
  const ridePct = useWalletStore((s) => s.ridePromoPercent);
  const clearFoodPromo = useWalletStore((s) => s.clearFoodPromo);
  const clearRidePromo = useWalletStore((s) => s.clearRidePromo);
  const [code, setCode] = useState('');

  function onApply() {
    const res = applyPromoCode(code);
    if (res.ok) {
      Alert.alert('Applied', res.message);
      setCode('');
    } else {
      Alert.alert('Promo', res.message);
    }
  }

  return (
    <Screen keyboardAvoid>
      <View style={styles.card}>
        <AppTextField label="Enter code" value={code} onChangeText={setCode} placeholder="WELCOME10" autoCapitalize="characters" />
        <AppButton title="Apply code" onPress={onApply} />
        <View style={styles.hints}>
          <Text style={styles.hintTitle}>Try demo codes</Text>
          <Text style={styles.hint}>WELCOME10 — 10% off next food order</Text>
          <Text style={styles.hint}>RIDER5 — 5% off next ride</Text>
          <Text style={styles.hint}>BONUS5 — $5 wallet credit</Text>
        </View>
        {(foodPct != null || ridePct != null) && (
          <View style={styles.active}>
            <Text style={styles.activeTitle}>Active savings</Text>
            {foodPct != null ? <Text style={styles.activeLine}>Food checkout: {foodPct}% off (single use)</Text> : null}
            {ridePct != null ? <Text style={styles.activeLine}>Next ride: {ridePct}% off (single use)</Text> : null}
            <AppButton title="Clear food promo" variant="secondary" onPress={clearFoodPromo} />
            <AppButton title="Clear ride promo" variant="ghost" onPress={clearRidePromo} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  hints: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  hintTitle: { fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  hint: { color: colors.textMuted, lineHeight: 20, fontSize: 14 },
  active: { marginTop: spacing.md, gap: spacing.sm },
  activeTitle: { fontWeight: '800', color: colors.primary },
  activeLine: { color: colors.text, fontSize: 14 },
});
