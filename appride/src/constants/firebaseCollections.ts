/**
 * Firestore collection names in one place — avoids typos across services.
 * Matches the structure described in your project brief.
 */
export const COLLECTIONS = {
  users: 'users',
  drivers: 'drivers',
  /** Phase 4 — online delivery riders (separate from ride drivers). */
  deliveryRiders: 'deliveryRiders',
  rides: 'rides',
  locations: 'locations',
  /** Subcollection: rides/{rideId}/messages */
  rideChatMessages: 'messages',
  /** Gateway payment audit log (new plan). */
  paymentRecords: 'paymentRecords',
  /** Phase 2 — customer saved cards & bank accounts (metadata only). */
  paymentMethods: 'paymentMethods',
  /** Phase 3 — partner earnings + withdrawal ledger (confirmed balance drives partner wallet). */
  partnerWalletTx: 'partnerWalletTx',
  /** Phase 3 — partner payout methods for withdrawals. */
  partnerPayoutMethods: 'partnerPayoutMethods',
  /** Phase 5 — realtime accept/reject queue for online drivers & delivery riders. */
  partnerRequestNotifications: 'partnerRequestNotifications',
  /** Food orders mirrored for delivery / dashboards (new plan). */
  foodOrders: 'foodOrders',
  /** Phase 3 — searchable marketplace catalog (restaurant docs include `menu` array). */
  foodRestaurants: 'foodRestaurants',
} as const;
