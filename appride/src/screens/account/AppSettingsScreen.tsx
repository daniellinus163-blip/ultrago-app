import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function AppSettingsScreen() {
  const reduceMotionUi = useAppSettingsStore((s) => s.reduceMotionUi);
  const setReduceMotionUi = useAppSettingsStore((s) => s.setReduceMotionUi);
  const useMetricUnits = useAppSettingsStore((s) => s.useMetricUnits);
  const setUseMetricUnits = useAppSettingsStore((s) => s.setUseMetricUnits);

  return (
    <Screen>
      <Text style={styles.intro}>These preferences are stored on this device only.</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Reduce motion UI</Text>
          <Text style={styles.hint}>Fewer animated flourishes where supported.</Text>
        </View>
        <Switch
          value={reduceMotionUi}
          onValueChange={setReduceMotionUi}
          trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
        />
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Metric units</Text>
          <Text style={styles.hint}>Distances and speeds use km where applicable.</Text>
        </View>
        <Switch
          value={useMetricUnits}
          onValueChange={setUseMetricUnits}
          trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
