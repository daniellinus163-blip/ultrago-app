import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { updateUserProfileFields } from '../../services/users/userProfile';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'SecuritySettings'>;

export function SecuritySettingsScreen({}: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [alerts, setAlerts] = useState(Boolean(profile?.securityAlertsEnabled ?? true));
  const [twoFaHint, setTwoFaHint] = useState(Boolean(profile?.twoFactorHintAcknowledged));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAlerts(profile?.securityAlertsEnabled !== false);
    setTwoFaHint(profile?.twoFactorHintAcknowledged === true);
  }, [profile?.securityAlertsEnabled, profile?.twoFactorHintAcknowledged]);

  async function persist(patch: { securityAlertsEnabled?: boolean; twoFactorHintAcknowledged?: boolean }) {
    if (!user) {
      return;
    }
    setBusy(true);
    try {
      await updateUserProfileFields(user.uid, patch);
      await refreshProfile();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update.';
      Alert.alert('Update failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.intro}>Security preferences are stored on your UltraGo profile in Firestore.</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Account alerts</Text>
          <Text style={styles.hint}>Login and unusual activity reminders (when push is connected).</Text>
        </View>
        <Switch
          value={alerts}
          disabled={busy}
          onValueChange={(v) => {
            setAlerts(v);
            void persist({ securityAlertsEnabled: v });
          }}
          trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
        />
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>2FA reminder dismissed</Text>
          <Text style={styles.hint}>Mark the “add two-factor” education banner as seen.</Text>
        </View>
        <Switch
          value={twoFaHint}
          disabled={busy}
          onValueChange={(v) => {
            setTwoFaHint(v);
            void persist({ twoFactorHintAcknowledged: v });
          }}
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
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  hint: { marginTop: spacing.xs, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
