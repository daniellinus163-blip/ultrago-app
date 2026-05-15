import type { LatLng } from '../../types/geo';

export type SimulatedDriver = {
  id: string;
  location: LatLng;
};

/**
 * @deprecated Phase 4 — use `subscribeNearbyDrivers` from `./nearbyPartners` instead.
 */
export function simulateNearbyDrivers(center: LatLng, count = 4): SimulatedDriver[] {
  const offsets = [
    { dLat: 0.006, dLon: 0.003 },
    { dLat: -0.005, dLon: 0.007 },
    { dLat: 0.004, dLon: -0.006 },
    { dLat: -0.007, dLon: -0.004 },
  ];
  return offsets.slice(0, count).map((o, i) => ({
    id: `sim-${i}`,
    location: { latitude: center.latitude + o.dLat, longitude: center.longitude + o.dLon },
  }));
}

/** Pick the closest simulated driver by straight-line distance (km). */
export function pickClosestDriver(
  pickup: LatLng,
  drivers: SimulatedDriver[],
): SimulatedDriver | null {
  if (!drivers.length) {
    return null;
  }
  let best = drivers[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const d of drivers) {
    const lat = ((pickup.latitude - d.location.latitude) * Math.PI) / 180;
    const lon = ((pickup.longitude - d.location.longitude) * Math.PI) / 180;
    const approx = Math.sqrt(lat * lat + lon * lon) * 111;
    if (approx < bestD) {
      bestD = approx;
      best = d;
    }
  }
  return best;
}
