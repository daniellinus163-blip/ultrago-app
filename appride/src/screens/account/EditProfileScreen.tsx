import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { updateUserProfileFields } from '../../services/users/userProfile';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (!user) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    setBusy(true);
    try {
      await updateUserProfileFields(user.uid, { displayName: trimmed });
      await refreshProfile();
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save profile.';
      Alert.alert('Save failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboardAvoid>
      <View style={styles.pad}>
        <AppTextField
          label="Display name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          editable={!busy}
        />
        <AppButton title="Save changes" variant="primary" onPress={() => void onSave()} disabled={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg },
});
