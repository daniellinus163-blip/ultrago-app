import { create } from 'zustand';

import type { Restaurant } from '../types/food';

export type FoodCatalogSource = 'firestore' | 'local';

type FoodCatalogState = {
  restaurants: Restaurant[];
  source: FoodCatalogSource;
  loading: boolean;
  error: string | null;
  setCatalog: (rows: Restaurant[], source: FoodCatalogSource) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
};

export const useFoodCatalogStore = create<FoodCatalogState>((set) => ({
  restaurants: [],
  source: 'local',
  loading: true,
  error: null,
  setCatalog: (rows, source) => set({ restaurants: rows, source, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

export function getRestaurantFromCatalog(restaurantId: string | undefined): Restaurant | undefined {
  if (!restaurantId) {
    return undefined;
  }
  return useFoodCatalogStore.getState().restaurants.find((r) => r.id === restaurantId);
}
