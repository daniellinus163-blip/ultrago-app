import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { uploadUserProfilePhotoFromUri } from '../../services/firebase/storage';
import { isProfileRegistrationComplete, updateUserProfileFields } from '../../services/users/userProfile';
import { hasEnteredProfileBasics, PROFILE_PHOTO_LOCKED_MESSAGE } from '../../utils/profilePhotoGate';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'ProfilePhoto'>;

export function ProfilePhotoScreen({ navigation }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);

  const profileComplete = isProfileRegistrationComplete(profile);

  const canUpload = useMemo(() => {
    if (profileComplete) {
      return true;
    }
    const loc = profile?.lastKnownLocation;
    return hasEnteredProfileBasics({
      displayName: profile?.displayName ?? user?.displayName ?? '',
      phone: profile?.phoneNumber ?? '',
      hasLocation: Boolean(loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'),
    });
  }, [profile, profileComplete, user?.displayName]);

  async function pickAndUpload() {
    if (!user) {
      return;
    }
    if (!canUpload) {
      Alert.alert('Profile photo', PROFILE_PHOTO_LOCKED_MESSAGE);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    const uri = asset.uri;
    setBusy(true);
    try {
      const mime = asset.mimeType ?? 'image/jpeg';
      const url = await uploadUserProfilePhotoFromUri(user.uid, uri, mime);
      await updateUserProfileFields(user.uid, { photoUrl: url });
      await refreshProfile();
      Alert.alert('Saved', 'Profile photo updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed.';
      Alert.alert('Photo', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboardAvoid>
      <View style={styles.pad}>
        {canUpload ? (
          <Text style={styles.note}>
            Choose a square crop. The image is uploaded to Firebase Storage (configure rules for{' '}
            <Text style={styles.mono}>users/{'{uid}'}/…</Text>).
          </Text>
        ) : (
          <Text style={styles.locked}>{PROFILE_PHOTO_LOCKED_MESSAGE}</Text>
        )}
        <AppButton
          title={canUpload ? 'Choose from library' : 'Complete profile first'}
          onPress={() => void pickAndUpload()}
          loading={busy}
          disabled={!canUpload}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, gap: spacing.lg },
  note: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  locked: {
    color: colors.accentOrange,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
});
