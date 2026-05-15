import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isPushNotificationsNativeEnabled } from '../../lib/expoRuntime';

/**
 * Phase 7 — foreground notification display + token registration for server FCM later.
 */
export async function initNotificationHandlers(): Promise<void> {
  if (!isPushNotificationsNativeEnabled()) {
    return;
  }
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: Platform.OS === 'android',
        shouldSetBadge: false,
      }),
    });
  } catch {
    /* Expo Go may restrict some APIs */
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!isPushNotificationsNativeEnabled()) {
    return null;
  }
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

/** Listen for notification taps (deep-link hook for Phase 7+). */
export function subscribeNotificationResponses(
  onOpen: (data: Record<string, unknown>) => void,
): () => void {
  if (!isPushNotificationsNativeEnabled()) {
    return () => {};
  }
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data && typeof data === 'object') {
      onOpen(data as Record<string, unknown>);
    }
  });
  return () => sub.remove();
}
