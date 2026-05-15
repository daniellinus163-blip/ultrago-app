import * as Location from 'expo-location';

/** Human-readable label from GPS (street / city). */
export async function resolveLocationLabel(latitude: number, longitude: number): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];
    if (!place) {
      return 'Your location';
    }
    const parts = [
      place.name,
      place.street,
      place.district,
      place.city,
      place.subregion,
      place.region,
    ].filter((p) => p && String(p).trim().length > 0);
    const unique = [...new Set(parts.map((p) => String(p).trim()))];
    return unique.slice(0, 3).join(', ') || 'Your location';
  } catch {
    return 'Your location';
  }
}
