export type FoodCategoryId =
  | 'all'
  | 'burgers'
  | 'asian'
  | 'healthy'
  | 'dessert'
  | 'drinks'
  | 'pizza'
  | 'shawarma'
  | 'rice'
  | 'pasta'
  | 'fast_food'
  | 'local'
  | 'street';

export type FoodMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Exclude<FoodCategoryId, 'all'>;
  imageEmoji?: string;
  /** Optional remote image (Phase “food marketplace”). */
  imageUrl?: string;
};

export type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  etaMin: number;
  deliveryFee: number;
  categories: Exclude<FoodCategoryId, 'all'>[];
  heroEmoji: string;
  /** Optional hero image URL for marketplace polish. */
  imageUrl?: string;
  /** 0–100 merchandising score for “Popular” filters (Firestore + local seed). */
  popularScore?: number;
  /** WGS84 — used for “Near me” distance (km). */
  lat?: number;
  lng?: number;
  menu: FoodMenuItem[];
};

export type CartLine = {
  restaurantId: string;
  restaurantName: string;
  itemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  /** Phase 6 — local asset key for cart thumbnails */
  imageAssetKey?: string;
};

export type FoodOrderStatus = 'received' | 'preparing' | 'out_for_delivery' | 'delivered';

export type FoodOrder = {
  id: string;
  placedAt: number;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  status: FoodOrderStatus;
  /** Customer Firebase uid. */
  customerId?: string;
  /** Assigned delivery partner uid. */
  deliveryRiderId?: string | null;
  /** Shown on delivery desk (Phase 4). */
  customerDisplayName?: string;
  deliveryAddressLabel?: string;
  /** Phase 5 — rider marked drop-off; customer must confirm for wallet credit. */
  riderMarkedDeliveredAt?: number;
  customerConfirmedDelivery?: boolean;
  customerConfirmedAt?: number;
};
