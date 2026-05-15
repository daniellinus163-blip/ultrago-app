import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList, MainTabParamList } from '../../navigation/types';
import { setDriverOffline } from '../../services/drivers/driverPresence';
import { isProfileRegistrationComplete, setDriverModeEnabled } from '../../services/users/userProfile';
import { hasEnteredProfileBasics, PROFILE_PHOTO_LOCKED_MESSAGE } from '../../utils/profilePhotoGate';
import type { AppRole } from '../../types/user';
import { colors, gradients } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AccountMenuRow } from './AccountMenuRow';

type Props = NativeStackScreenProps<AccountStackParamList, 'AccountHome'>;

function appRoleLabel(role?: AppRole | null): string {
  if (role === 'driver') {
    return 'Driver';
  }
  if (role === 'delivery_rider') {
    return 'Delivery rider';
  }
  if (role === 'customer') {
    return 'Customer';
  }
  return 'Not set';
}

export function AccountHomeScreen({ navigation }: Props) {
  const { user, profile, signOutUser, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const driverMode = Boolean(profile?.driverModeEnabled);

  const tabNav = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();

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

  async function onToggleDriverMode(next: boolean) {
    if (!user) {
      return;
    }
    setBusy(true);
    try {
      await setDriverModeEnabled(user.uid, next);
      if (!next) {
        await setDriverOffline(user.uid);
      }
      await refreshProfile();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update profile.';
      Alert.alert('Update failed', message);
    } finally {
      setBusy(false);
    }
  }

  function confirmSignOut() {
    Alert.alert('Sign out', 'You will need to sign in again to use rides and wallet.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOutUser() },
    ]);
  }

  const initial =
    (profile?.displayName?.trim()?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...gradients.authWash]} style={styles.hero}>
          <View style={styles.avatarRing}>
            {profile?.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={styles.avatarLetter}>{initial}</Text>
            )}
          </View>
          <Text style={styles.heroName}>{profile?.displayName?.trim() || 'UltraGo rider'}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>
          <AppButton
            title="View profile"
            variant="secondary"
            onPress={() => navigation.navigate('Profile')}
            style={styles.heroBtn}
          />
        </LinearGradient>

        <View style={styles.menuCard}>
          <AccountMenuRow
            icon="person-circle-outline"
            title="App role"
            subtitle={`Current: ${appRoleLabel(profile?.appRole)} · switch customer / driver / delivery`}
            onPress={() => navigation.navigate('AppRole')}
          />
          <AccountMenuRow
            icon="wallet-outline"
            title="Payment methods"
            subtitle="Cards & bank accounts saved in Firebase"
            onPress={() => tabNav?.navigate('Wallet', { screen: 'WalletHome' })}
          />
          <AccountMenuRow
            icon="cloud-done-outline"
            title="Gateway payment log"
            subtitle="Paystack / Stripe-style records in Firestore"
            onPress={() => tabNav?.navigate('Wallet', { screen: 'PaymentHistory' })}
          />
          <AccountMenuRow
            icon="bookmark-outline"
            title="Saved places"
            subtitle="Home, work, and custom spots"
            onPress={() => navigation.navigate('SavedPlaces')}
          />
          <AccountMenuRow
            icon="camera-outline"
            title="Profile photo"
            subtitle={
              canUpdateProfilePhoto
                ? 'Upload to Firebase Storage'
                : 'Complete name, phone & location first'
            }
            onPress={openProfilePhoto}
          />
          <AccountMenuRow
            icon="key-outline"
            title="Password"
            subtitle="Change email/password login"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <AccountMenuRow
            icon="color-palette-outline"
            title="Theme & language"
            subtitle="Saved to your profile"
            onPress={() => navigation.navigate('ThemeLanguage')}
          />
          <AccountMenuRow
            icon="shield-outline"
            title="Security"
            subtitle="Alerts and account safety"
            onPress={() => navigation.navigate('SecuritySettings')}
          />
          <AccountMenuRow
            icon="settings-outline"
            title="App settings"
            subtitle="Display and units"
            onPress={() => navigation.navigate('AppSettings')}
          />
          <AccountMenuRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="What we can notify you about"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <AccountMenuRow
            icon="help-circle-outline"
            title="Help & support"
            subtitle="FAQ, contact, safety"
            onPress={() => navigation.navigate('HelpSupport')}
          />
        </View>

        <View style={styles.driverCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Driver mode</Text>
            <Text style={styles.toggleHint}>Unlocks the Drive tab workflow (accept requests, go online).</Text>
          </View>
          <Switch
            value={driverMode}
            disabled={busy}
            onValueChange={onToggleDriverMode}
            trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
          />
        </View>

        <AppButton title="Sign out" variant="secondary" onPress={confirmSignOut} style={styles.logout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl * 2,
  },
  hero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.xl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  heroName: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  heroEmail: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textMuted,
  },
  heroBtn: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  menuCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  toggleHint: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
    fontSize: 13,
  },
  logout: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
});
