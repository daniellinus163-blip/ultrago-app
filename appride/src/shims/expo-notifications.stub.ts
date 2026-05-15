/**
 * Stub for `expo-notifications` in Expo Go (SDK 53+ removed Android remote push).
 * Avoids the red LogBox error: "Android Push notifications ... removed from Expo Go".
 */

export const SchedulableTriggerInputTypes = {
  TIME_INTERVAL: 'timeInterval',
  CALENDAR: 'calendar',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  DATE: 'date',
  CHANNEL: 'channel',
} as const;

type PermissionStatus = 'undetermined' | 'denied' | 'granted';

function permissionResponse(status: PermissionStatus = 'denied') {
  return {
    status,
    granted: status === 'granted',
    expires: 'never' as const,
    canAskAgain: status !== 'granted',
  };
}

export function setNotificationHandler(_handler: unknown): void {}

export async function getPermissionsAsync() {
  return permissionResponse('denied');
}

export async function requestPermissionsAsync() {
  return permissionResponse('denied');
}

export async function getExpoPushTokenAsync() {
  return { data: '' };
}

export function addNotificationResponseReceivedListener(_listener: unknown) {
  return { remove: () => {} };
}

export async function scheduleNotificationAsync(_request: unknown): Promise<string> {
  return `stub-${Date.now()}`;
}

export async function cancelScheduledNotificationAsync(_id: string): Promise<void> {}

export async function dismissAllNotificationsAsync(): Promise<void> {}
