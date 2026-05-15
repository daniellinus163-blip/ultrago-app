import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { updateUserProfileFields } from '../../services/users/userProfile';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'NotificationSettings'>;

export function NotificationSettingsScreen({}: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [ride, setRide] = useState(true);
  const [food, setFood] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRide(profile?.notifRidePush ?? true);
    setFood(profile?.notifFoodPush ?? true);
    setMarketing(profile?.notifMarketing ?? false);
  }, [profile?.notifRidePush, profile?.notifFoodPush, profile?.notifMarketing]);

  async function save(patch: { notifRidePush?: boolean; notifFoodPush?: boolean; notifMarketing?: boolean }) {
    if (!user) {
      return;
    }
    setBusy(true);
    try {
      await updateUserProfileFields(user.uid, patch);
      await refreshProfile();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save.';
      Alert.alert('Save failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.intro}>Preferences sync to your Firestore user profile for this account.</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Ride status</Text>
          <Text style={styles.hint}>Driver assigned, arriving, trip updates.</Text>
        </View>
        <Switch
          value={ride}
          disabled={busy}
          onValueChange={(v) => {
            setRide(v);
            void save({ notifRidePush: v });
          }}
          trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
        />
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Food orders</Text>
          <Text style={styles.hint}>Prep, pickup, and delivery milestones.</Text>
        </View>
        <Switch
          value={food}
          disabled={busy}
          onValueChange={(v) => {
            setFood(v);
            void save({ notifFoodPush: v });
          }}
          trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
        />
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tips & promos</Text>
          <Text style={styles.hint}>Occasional offers and product news.</Text>
        </View>
        <Switch
          value={marketing}
          disabled={busy}
          onValueChange={(v) => {
            setMarketing(v);
            void save({ notifMarketing: v });
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
