import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './context/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { KeyboardProvider } from './components/ui/keyboardComponents';
import { initNotificationHandlers, subscribeNotificationResponses } from './services/notifications/push';

/**
 * Root composition for the UltraGo MVP:
 * - Gesture + SafeArea wrappers are required partners for React Navigation on Android/iOS.
 * - `AuthProvider` owns Firebase Auth session + Firestore profile hydration.
 * - `initNotificationHandlers` prepares Expo Notifications (FCM on Android via EAS).
 */
export default function App() {
  useEffect(() => {
    void initNotificationHandlers().catch(() => {
      /* non-fatal on some Expo Go builds */
    });
    try {
      const unsub = subscribeNotificationResponses((data) => {
        if (__DEV__ && data.rideId) {
          console.log('[Push] Opened notification for ride', data.rideId);
        }
      });
      return unsub;
    } catch {
      return undefined;
    }
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <SafeAreaProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
