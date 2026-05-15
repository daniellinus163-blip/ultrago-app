import { GeoPoint } from 'firebase/firestore';

import type { LatLng } from '../../types/geo';
import { updateRideStatus } from './rideLifecycle';

const DEMO_DRIVER_ID = 'sim-demo-driver';

function lerp(a: LatLng, b: LatLng, t: number): { lat: number; lng: number } {
  return {
    lat: a.latitude + (b.latitude - a.latitude) * t,
    lng: a.longitude + (b.longitude - a.longitude) * t,
  };
}

function isAutoSimEnabled(): boolean {
  return process.env.EXPO_PUBLIC_AUTO_SIMULATE_DRIVER === '1';
}

/**
 * Classroom / single-device demo: advances ride status + `driverLocation` without a second phone.
 * Enable with `EXPO_PUBLIC_AUTO_SIMULATE_DRIVER=1` in `appride/.env`.
 */
export function startAutoSimulatedDriverFlow(
  rideId: string,
  pickup: LatLng,
  destination: LatLng,
): () => void {
  if (!isAutoSimEnabled()) {
    return () => {};
  }

  const timers: ReturnType<typeof setTimeout>[] = [];

  const schedule = (ms: number, fn: () => void | Promise<void>) => {
    timers.push(
      setTimeout(() => {
        void fn();
      }, ms),
    );
  };

  schedule(2500, async () => {
    const p = lerp(pickup, destination, 0.08);
    await updateRideStatus(rideId, 'driver_accepted', {
      driverId: DEMO_DRIVER_ID,
      driverLocation: new GeoPoint(p.lat, p.lng),
    });
  });

  schedule(6000, async () => {
    const p = lerp(pickup, destination, 0.22);
    await updateRideStatus(rideId, 'driver_arriving', {
      driverLocation: new GeoPoint(p.lat, p.lng),
    });
  });

  schedule(9500, async () => {
    await updateRideStatus(rideId, 'driver_arriving', {
      driverLocation: new GeoPoint(pickup.latitude, pickup.longitude),
    });
  });

  schedule(12000, async () => {
    const p = lerp(pickup, destination, 0.55);
    await updateRideStatus(rideId, 'in_progress', {
      driverLocation: new GeoPoint(p.lat, p.lng),
    });
  });

  schedule(19000, async () => {
    await updateRideStatus(rideId, 'in_progress', {
      driverLocation: new GeoPoint(destination.latitude, destination.longitude),
    });
  });

  schedule(22000, async () => {
    await updateRideStatus(rideId, 'completed', {
      driverLocation: new GeoPoint(destination.latitude, destination.longitude),
    });
  });

  return () => {
    for (const t of timers) {
      clearTimeout(t);
    }
  };
}

/** Dev-only helper to jump from `searching` → accepted without a second device. */
export async function simulateDriverAcceptForDev(rideId: string, near: LatLng): Promise<void> {
  const lat = near.latitude + 0.003;
  const lng = near.longitude + 0.002;
  await updateRideStatus(rideId, 'driver_accepted', {
    driverId: DEMO_DRIVER_ID,
    driverLocation: new GeoPoint(lat, lng),
  });
}
