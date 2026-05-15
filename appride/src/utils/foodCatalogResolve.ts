import { MOCK_RESTAURANTS } from '../data/mockRestaurants';
import { useFoodCatalogStore } from '../store/foodCatalogStore';
import type { Restaurant } from '../types/food';

/** Prefer live Firestore-backed catalog; fall back to bundled seed until hydration. */
export function resolveRestaurant(restaurantId: string | undefined): Restaurant | undefined {
  if (!restaurantId) {
    return undefined;
  }
  const live = useFoodCatalogStore.getState().restaurants;
  return live.find((r) => r.id === restaurantId) ?? MOCK_RESTAURANTS.find((r) => r.id === restaurantId);
}
