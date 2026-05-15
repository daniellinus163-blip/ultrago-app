/** Rider-facing service tier — Phase 2 home & map experience. */
export type RideServiceCategory = 'economy' | 'premium' | 'bike' | 'delivery';

export const RIDE_SERVICE_LABELS: Record<RideServiceCategory, string> = {
  economy: 'Economy',
  premium: 'Premium',
  bike: 'Bike',
  delivery: 'Delivery',
};
