import type { AppRole } from './user';
import type { LatLng } from './geo';

/** Public partner info shown to customers (Phase 4 — from Firestore `users` + presence). */
export type PartnerPublicProfile = {
  uid: string;
  displayName: string;
  photoUrl: string | null;
  phoneNumber: string | null;
  ratingAvg: number;
  ratingCount: number;
  vehicleLabel: string | null;
  appRole: AppRole;
};

/** Online driver or delivery rider near the customer. */
export type NearbyPartner = PartnerPublicProfile & {
  coordinate: LatLng;
  distanceKm: number;
};
