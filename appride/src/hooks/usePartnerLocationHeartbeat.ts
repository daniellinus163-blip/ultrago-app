import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';

import type { LatLng } from '../types/geo';

type HeartbeatFn = (coords: LatLng) => Promise<void>;

/**
 * While a driver or delivery rider is online, push GPS to Firestore on an interval.
 */
export function usePartnerLocationHeartbeat(online: boolean, pushLocation: HeartbeatFn): void {
  const pushRef = useRef(pushLocation);
  pushRef.current = pushLocation;

  useEffect(() => {
    if (!online) {
      return;
    }
    let sub: Location.LocationSubscription | undefined;
    let lastWrite = 0;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 8000,
          distanceInterval: 35,
        },
        (pos) => {
          const now = Date.now();
          if (now - lastWrite < 7000) {
            return;
          }
          lastWrite = now;
          void pushRef.current({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
      );
    })();

    return () => {
      sub?.remove();
    };
  }, [online]);
}
