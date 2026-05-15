import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { isProfileRegistrationComplete } from '../../services/users/userProfile';
import { hasEnteredProfileBasics, PROFILE_PHOTO_LOCKED_MESSAGE } from '../../utils/profilePhotoGate';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const initial =
    (profile?.displayName?.trim()?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  const canUpdateProfilePhoto = useMemo(() => {
    if (isProfileRegistrationComplete(profile)) {
      return true;
    }
    const loc = profile?.lastKnownLocation;
    return hasEnteredProfileBasics({
      displayName: profile?.displayName ?? user?.displayName ?? '',
      phone: profile?.phoneNumber ?? '',
      hasLocation: Boolean(loc && typeof loc.lat === 'number'),
    });
  }, [profile, user?.displayName]);

  function openProfilePhoto() {
    if (!canUpdateProfilePhoto) {
      Alert.alert('Profile photo', PROFILE_PHOTO_LOCKED_MESSAGE);
      return;
    }
    navigation.navigate('ProfilePhoto');
  }

  return (
    <Screen>
      <View style={styles.card}>
        <View style={styles.avatar}>
          {profile?.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={styles.avatarLetter}>{initial}</Text>
          )}
        </View>
        <Text style={styles.name}>{profile?.displayName?.trim() || 'Not set'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
          <Text style={styles.meta}>Role: {profile?.role ?? 'rider'}</Text>
        </View>
      </View>

      <AppButton
        title={canUpdateProfilePhoto ? 'Profile photo' : 'Profile photo (complete profile first)'}
        variant="secondary"
        onPress={openProfilePhoto}
        style={styles.btnSecondary}
      />
      <AppButton
        title="Edit profile"
        variant="primary"
        onPress={() => navigation.navigate('EditProfile')}
        style={styles.btn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
  },
  avatarImg: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  name: {
    marginTop: spacing.lg,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  btn: {
    marginHorizontal: spacing.lg,
  },
  btnSecondary: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
