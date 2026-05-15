/**
 * Geo types shared by maps, Firestore ride documents, and matching logic.
 * LatLng matches what `react-native-maps` expects for markers and polylines.
 */
export type LatLng = {
  latitude: number;
  longitude: number;
};

export type GeoPoint = LatLng & {
  /** Human-readable label shown in the UI (e.g. street or place name). */
  address?: string;
};
