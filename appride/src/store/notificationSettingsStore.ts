import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type NotificationSettings = {
  rideStatusPush: boolean;
  foodOrderPush: boolean;
  marketingEmail: boolean;
  setRideStatusPush: (v: boolean) => void;
  setFoodOrderPush: (v: boolean) => void;
  setMarketingEmail: (v: boolean) => void;
};

export const useNotificationSettingsStore = create<NotificationSettings>()(
  persist(
    (set) => ({
      rideStatusPush: true,
      foodOrderPush: true,
      marketingEmail: false,
      setRideStatusPush: (v) => set({ rideStatusPush: v }),
      setFoodOrderPush: (v) => set({ foodOrderPush: v }),
      setMarketingEmail: (v) => set({ marketingEmail: v }),
    }),
    { name: 'ultrago-notification-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
