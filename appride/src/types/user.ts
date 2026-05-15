/**
 * `role` stays simple for teaching: everyone can experiment with driver mode.
 * `appRole` is the post-login persona (plan: Customer / Driver / Delivery rider).
 */
export type UserRole = 'rider' | 'driver';

/** Saved in Firestore after role selection screen. */
export type AppRole = 'customer' | 'driver' | 'delivery_rider';

export type ThemePreference = 'system' | 'light' | 'dark';

/** Last device-reported position at signup / registration (plain JSON for Firestore rules & clients). */
export type UserLastKnownLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  capturedAt: number;
};

/** Role-specific shells in Firestore — extend in later phases (vehicle, payout, etc.). */
export type CustomerProfileStub = { version: 1 };
export type PartnerVehicleStub = {
  version: 1;
  vehicleNote?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  ratingAvg?: number;
  ratingCount?: number;
};

export type DriverProfileStub = PartnerVehicleStub;
export type DeliveryRiderProfileStub = PartnerVehicleStub;

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** E.164 or local digits — required after Phase 1 registration. */
  phoneNumber?: string | null;
  /** When true, the driver stack becomes available (Phase 8). */
  driverModeEnabled?: boolean;
  /** FCM device token — stored so Cloud Functions / your client can target pushes (Phase 10). */
  pushToken?: string | null;
  createdAt?: number;
  /** Post-auth persona — required before main app (new plan). */
  appRole?: AppRole | null;
  /** Captured during signup / registration completion (Firebase). */
  lastKnownLocation?: UserLastKnownLocation | null;
  photoUrl?: string | null;
  customerProfile?: CustomerProfileStub | null;
  driverProfile?: DriverProfileStub | null;
  deliveryRiderProfile?: DeliveryRiderProfileStub | null;
  themePreference?: ThemePreference;
  /** BCP-47-ish tag, e.g. en, fr */
  locale?: string;
  /** Security / alerts opt-in flags (stored in Firestore). */
  securityAlertsEnabled?: boolean;
  twoFactorHintAcknowledged?: boolean;
  /** Notification preferences mirrored in Firestore (Account → Notifications). */
  notifRidePush?: boolean;
  notifFoodPush?: boolean;
  notifMarketing?: boolean;
};
