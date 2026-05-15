/**
 * Google Places (legacy REST) — used for Phase 2 destination autocomplete.
 * Enable "Places API" for the same key as EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in Google Cloud Console.
 */

export type PlacePrediction = {
  placeId: string;
  description: string;
};

export type PlaceLocation = {
  latitude: number;
  longitude: number;
  name: string;
};

function mapsKey(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

export async function fetchPlacePredictions(input: string): Promise<PlacePrediction[]> {
  const key = mapsKey();
  const q = input.trim();
  if (!key || q.length < 2) {
    return [];
  }
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    q,
  )}&key=${key}&types=geocode`;
  const res = await fetch(url);
  const json = (await res.json()) as { status?: string; predictions?: { place_id: string; description: string }[] };
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    return [];
  }
  return (json.predictions ?? []).map((p) => ({ placeId: p.place_id, description: p.description }));
}

export async function fetchPlaceLocation(placeId: string): Promise<PlaceLocation | null> {
  const key = mapsKey();
  if (!key) {
    return null;
  }
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId,
  )}&fields=geometry%2Flocation%2Cname&key=${key}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status?: string;
    result?: { name?: string; geometry?: { location?: { lat: number; lng: number } } };
  };
  if (json.status !== 'OK' || !json.result?.geometry?.location) {
    return null;
  }
  const loc = json.result.geometry.location;
  return {
    latitude: loc.lat,
    longitude: loc.lng,
    name: json.result.name ?? 'Selected place',
  };
}
