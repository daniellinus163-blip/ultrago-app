import type { LatLng } from '../types/geo';

const EARTH_KM = 6371;

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Straight-line ETA minutes (MVP — Phase 7 can swap for Directions traffic). */
export function etaMinutesStraightLine(from: LatLng, to: LatLng, speedKmh = 28): number {
  const km = haversineKm(from, to);
  const hours = km / speedKmh;
  return Math.max(1, Math.round(hours * 60));
}

export function formatEtaMinutes(mins: number): string {
  if (mins < 60) {
    return `${mins} min`;
  }
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
