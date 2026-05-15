import type { GeoPoint } from './geo';

export type PartnerRequestKind = 'ride' | 'food_delivery';

export type PartnerRequestNotificationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type PartnerRequestNotification = {
  id: string;
  partnerUid: string;
  kind: PartnerRequestKind;
  referenceId: string;
  status: PartnerRequestNotificationStatus;
  customerId: string;
  customerDisplayName?: string;
  customerLocation: GeoPoint;
  locationLabel?: string;
  orderTypeLabel: string;
  estimatedEarnings: number;
  currency: string;
  createdAtMs: number;
};
