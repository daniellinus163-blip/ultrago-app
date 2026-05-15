import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type State = {
  restaurantIds: string[];
  touchRestaurant: (id: string) => void;
};

export const useRecentlyOrderedStore = create<State>()(
  persist(
    (set) => ({
      restaurantIds: [],
      touchRestaurant: (id) =>
        set((s) => ({
          restaurantIds: [id, ...s.restaurantIds.filter((x) => x !== id)].slice(0, 12),
        })),
    }),
    { name: 'ultrago-recent-food', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
