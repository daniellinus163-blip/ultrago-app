import React, { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ProfileGateScreen } from '../screens/auth/ProfileGateScreen';
import { SetupRequiredScreen } from '../screens/setup/SetupRequiredScreen';
import { RegistrationScreen } from '../screens/auth/RegistrationScreen';
import { isProfileRegistrationComplete } from '../services/users/userProfile';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { AuthNavigator } from './AuthNavigator';

const MainNavigator = React.lazy(() =>
  import('./MainNavigator').then((m) => ({ default: m.MainNavigator })),
);

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surfaceElevated,
    text: colors.text,
    border: colors.border,
  },
};

/**
 * Single `NavigationContainer` for the whole app. We swap auth vs main manually
 * instead of a parent stack — fewer nested navigators for students to reason about.
 */
export function RootNavigator() {
  const { user, profile, initializing, firebaseConfigured } = useAuth();

  if (initializing) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!firebaseConfigured) {
    return <SetupRequiredScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <OfflineBanner />
      {user && !profile ? (
        <ProfileGateScreen />
      ) : user && profile && !isProfileRegistrationComplete(profile) ? (
        <RegistrationScreen />
      ) : user ? (
        <Suspense
          fallback={
            <View style={styles.boot}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          }
        >
          <MainNavigator />
        </Suspense>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
  },
});
