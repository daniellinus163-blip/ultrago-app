import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import type { FoodOrderStatus } from '../types/food';

const STATUS_MESSAGES: Partial<Record<FoodOrderStatus, string>> = {
  preparing: 'Your UltraGo order is being prepared.',
  out_for_delivery: 'Your order is out for delivery.',
  delivered: 'Your UltraGo order has been delivered.',
};

export function useLocalFoodOrderNotifications(status: FoodOrderStatus | undefined) {
  const prev = useRef<FoodOrderStatus | undefined>(undefined);

  useEffect(() => {
    if (!status) {
      prev.current = undefined;
      return;
    }
    const before = prev.current;
    if (before !== undefined && before !== status) {
      const body = STATUS_MESSAGES[status];
      if (body) {
        void Notifications.scheduleNotificationAsync({
          content: { title: 'UltraGo Food', body },
          trigger: null,
        }).catch(() => {});
      }
    }
    prev.current = status;
  }, [status]);
}
