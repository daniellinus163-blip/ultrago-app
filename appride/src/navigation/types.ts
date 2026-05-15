import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
};

export type FoodStackParamList = {
  FoodRestaurants: undefined;
  RestaurantDetail: { restaurantId: string };
  /** Phase 6 — `itemId` from local catalog; legacy `restaurantId` kept for old deep links. */
  FoodItemDetail: { itemId: string; restaurantId?: string };
  FoodCart: undefined;
  FoodCheckout: undefined;
  FoodOrderTracking: { orderId: string };
};

export type WalletStackParamList = {
  WalletHome: undefined;
  /** Phase 3 — driver/delivery rider earnings wallet (separate from customer payments). */
  PartnerWalletHome: undefined;
  PartnerWithdraw: undefined;
  PartnerAddBankAccountForWithdrawal: undefined;
  PartnerSetDefaultPayoutMethod: { methodId: string };
  /** Phase 2 — choose card vs bank vs provider architecture. */
  AddPaymentMethodHub: undefined;
  AddDebitCard: undefined;
  AddBankAccount: undefined;
  /** Legacy alias — same as WalletHome list (account deep links). */
  PaymentMethods: undefined;
  WalletTransactions: undefined;
  PaymentHistory: undefined;
  PromoCodes: undefined;
  Referral: undefined;
};

export type AccountStackParamList = {
  AccountHome: undefined;
  Profile: undefined;
  EditProfile: undefined;
  AppSettings: undefined;
  NotificationSettings: undefined;
  SavedPlaces: undefined;
  HelpSupport: undefined;
  ContactSupport: undefined;
  FAQ: undefined;
  ChangePassword: undefined;
  ProfilePhoto: undefined;
  ThemeLanguage: undefined;
  SecuritySettings: undefined;
  AppRole: undefined;
};

export type MainTabParamList = {
  RiderHome: undefined;
  Food: NavigatorScreenParams<FoodStackParamList>;
  TripHistory: undefined;
  Wallet: NavigatorScreenParams<WalletStackParamList>;
  DriverHome: undefined;
  /** Food delivery partner desk (visible for delivery_rider app role). */
  DeliveryDesk: undefined;
  Account: NavigatorScreenParams<AccountStackParamList>;
};
