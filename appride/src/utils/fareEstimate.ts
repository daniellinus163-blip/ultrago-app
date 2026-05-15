import type { GeoPoint } from '../types/geo';
import type { RideServiceCategory } from '../types/rideServiceCategory';

/** Earth radius in kilometers — used by the haversine helper below. */
const R = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two GPS points (kilometers).
 * Good enough for a student MVP fare estimate before you add Directions API billing.
 */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Simple linear fare: base + distance * rate. Tune constants for demos.
 */
export function estimateFareMvp(pickup: GeoPoint, destination: GeoPoint): number {
  const km = distanceKm(pickup, destination);
  const base = 2.5;
  const perKm = 1.4;
  const raw = base + km * perKm;
  return Math.round(raw * 100) / 100;
}

const CATEGORY_MULTIPLIER: Record<RideServiceCategory, number> = {
  economy: 1,
  premium: 1.55,
  bike: 0.85,
  delivery: 1.2,
};

export function estimateFareWithCategory(
  pickup: GeoPoint,
  destination: GeoPoint,
  category: RideServiceCategory,
): number {
  const base = estimateFareMvp(pickup, destination);
  const m = CATEGORY_MULTIPLIER[category] ?? 1;
  return Math.round(base * m * 100) / 100;
}
