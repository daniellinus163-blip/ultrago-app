import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppSettings = {
  reduceMotionUi: boolean;
  useMetricUnits: boolean;
  setReduceMotionUi: (v: boolean) => void;
  setUseMetricUnits: (v: boolean) => void;
};

export const useAppSettingsStore = create<AppSettings>()(
  persist(
    (set) => ({
      reduceMotionUi: false,
      useMetricUnits: true,
      setReduceMotionUi: (v) => set({ reduceMotionUi: v }),
      setUseMetricUnits: (v) => set({ useMetricUnits: v }),
    }),
    { name: 'ultrago-app-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
