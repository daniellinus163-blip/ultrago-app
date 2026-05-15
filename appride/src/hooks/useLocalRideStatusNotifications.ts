import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import type { Ride, RideStatus } from '../types/ride';

/**
 * Phase 10 (MVP): when Firestore updates the ride, show a **local** notification.
 * Production apps usually send FCM from Cloud Functions; this keeps everything client-side for learning.
 */
const STATUS_MESSAGES: Partial<Record<RideStatus, string>> = {
  driver_accepted: 'A driver accepted your ride.',
  driver_arriving: 'Your driver is arriving.',
  in_progress: 'Your trip has started.',
  completed: 'Your trip is complete. Thanks for riding with UltraGo!',
  cancelled: 'Your ride was cancelled.',
};

export function useLocalRideStatusNotifications(ride: Ride | null, forUserId: string | undefined) {
  const prevStatus = useRef<RideStatus | null>(null);

  useEffect(() => {
    if (!ride || !forUserId || ride.userId !== forUserId) {
      prevStatus.current = null;
      return;
    }
    const next = ride.status;
    const prev = prevStatus.current;
    if (prev !== null && prev !== next) {
      const body = STATUS_MESSAGES[next];
      if (body) {
        void Notifications.scheduleNotificationAsync({
          content: { title: 'UltraGo', body },
          trigger: null,
        }).catch(() => {
          /* Expo Go may restrict some paths; never crash the UI */
        });
      }
    }
    prevStatus.current = next;
  }, [forUserId, ride]);
}
