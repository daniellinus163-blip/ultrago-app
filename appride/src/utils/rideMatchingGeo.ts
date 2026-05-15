import type { LatLng } from '../types/geo';
import type { Ride } from '../types/ride';
import { distanceKm } from './fareEstimate';

export const OPEN_RIDE_MATCH_RADIUS_KM = 25;
export const NEARBY_DRIVER_DISPLAY_RADIUS_KM = 14;

export function filterRidesNearPartner(partner: LatLng, rides: Ride[], radiusKm = OPEN_RIDE_MATCH_RADIUS_KM): Ride[] {
  return rides
    .filter((ride) => {
      const km = distanceKm(partner, ride.pickupLocation);
      return km <= radiusKm;
    })
    .sort((a, b) => {
      const da = distanceKm(partner, a.pickupLocation);
      const db = distanceKm(partner, b.pickupLocation);
      return da - db;
    });
}

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
