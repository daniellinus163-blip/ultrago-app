import { create } from 'zustand';

type FavState = {
  ids: string[];
  toggle: (restaurantId: string) => void;
};

export const useFoodFavoritesStore = create<FavState>((set) => ({
  ids: [],
  toggle: (restaurantId) =>
    set((s) => ({
      ids: s.ids.includes(restaurantId) ? s.ids.filter((id) => id !== restaurantId) : [...s.ids, restaurantId],
    })),
}));
