import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export function tierForPoints(points: number): string {
  if (points >= 400) {
    return 'Gold';
  }
  if (points >= 150) {
    return 'Silver';
  }
  return 'Member';
}

type LoyaltyState = {
  points: number;
  lastPointsRideId: string | null;
  /** Call once when rider submits a trip rating (idempotent per ride). */
  addTripRatingPoints: (rideId: string, amount?: number) => void;
};

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      points: 0,
      lastPointsRideId: null,
      addTripRatingPoints: (rideId, amount = 25) => {
        if (!rideId || get().lastPointsRideId === rideId) {
          return;
        }
        set((s) => ({
          points: s.points + amount,
          lastPointsRideId: rideId,
        }));
      },
    }),
    { name: 'ultrago-loyalty', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
