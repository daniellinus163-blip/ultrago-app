import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { changePasswordWithCurrent } from '../../services/auth/emailAuth';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const hasEmailPassword = useMemo(
    () => Boolean(user?.providerData.some((p) => p.providerId === 'password')),
    [user],
  );

  async function onSave() {
    if (!hasEmailPassword) {
      return;
    }
    if (next !== confirm) {
      Alert.alert('Mismatch', 'New password and confirmation must match.');
      return;
    }
    setBusy(true);
    try {
      await changePasswordWithCurrent(current, next);
      Alert.alert('Updated', 'Your password was changed.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update password.';
      Alert.alert('Change failed', message);
    } finally {
      setBusy(false);
    }
  }

  if (!hasEmailPassword) {
    return (
      <Screen>
        <Text style={styles.note}>
          This account signs in with Google (or another provider). Password changes apply only to email/password
          accounts.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen keyboardAvoid>
      <View style={styles.pad}>
        <Text style={styles.hint}>Re-enter your current password, then choose a new one (min. 6 characters).</Text>
        <AppTextField
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          autoCapitalize="none"
          editable={!busy}
        />
        <AppTextField
          label="New password"
          value={next}
          onChangeText={setNext}
          secureTextEntry
          autoCapitalize="none"
          editable={!busy}
        />
        <AppTextField
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          editable={!busy}
        />
        <AppButton title="Update password" onPress={() => void onSave()} loading={busy} disabled={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, gap: spacing.md },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  note: {
    margin: spacing.lg,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
