import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import type { PartnerRequestNotification } from '../types/partnerRequestNotification';

/**
 * Phase 5 — local alert when a new pending partner request appears (FCM later).
 */
export function usePartnerRequestLocalAlerts(notifications: PartnerRequestNotification[]) {
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const n of notifications) {
      if (seen.current.has(n.id)) {
        continue;
      }
      seen.current.add(n.id);
      const title = n.kind === 'ride' ? 'New ride request' : 'New delivery request';
      const body = `Est. $${n.estimatedEarnings.toFixed(2)} · ${n.locationLabel ?? n.orderTypeLabel}`;
      void Notifications.scheduleNotificationAsync({
        content: { title: 'UltraGo Partner', body },
        trigger: null,
      }).catch(() => {});
    }
  }, [notifications]);
}
