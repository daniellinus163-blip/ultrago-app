import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SavedPlace = {
  id: string;
  label: string;
  address: string;
  /** Star for Favorites hub (ride shortcuts). */
  starred: boolean;
};

type SavedPlacesState = {
  places: SavedPlace[];
  addPlace: (p: Omit<SavedPlace, 'id'>) => void;
  removePlace: (id: string) => void;
  toggleStar: (id: string) => void;
};

export const useSavedPlacesStore = create<SavedPlacesState>()(
  persist(
    (set) => ({
      places: [],
      addPlace: (p) =>
        set((s) => ({
          places: [...s.places, { ...p, id: `pl-${Date.now()}` }],
        })),
      removePlace: (id) => set((s) => ({ places: s.places.filter((x) => x.id !== id) })),
      toggleStar: (id) =>
        set((s) => ({
          places: s.places.map((x) => (x.id === id ? { ...x, starred: !x.starred } : x)),
        })),
    }),
    { name: 'ultrago-saved-places', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
