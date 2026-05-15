import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ScheduledRideReminder = {
  id: string;
  label: string;
  fireAt: number;
  notificationId: string | null;
};

type ScheduledState = {
  items: ScheduledRideReminder[];
  scheduleReminder: (params: { label: string; minutesFromNow: number }) => Promise<string | null>;
  cancelReminder: (id: string) => Promise<void>;
};

export const useScheduledRidesStore = create<ScheduledState>()(
  persist(
    (set, get) => ({
      items: [],
      scheduleReminder: async ({ label, minutesFromNow }) => {
        const mins = Math.min(240, Math.max(5, Math.round(minutesFromNow)));
        const fireAt = Date.now() + mins * 60 * 1000;
        const id = `sch-${Date.now()}`;
        let notificationId: string | null = null;
        try {
          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'UltraGo · Scheduled ride',
              body: `${label} — leave in about ${mins} minutes (reminder you set).`,
            },
            trigger: {
              type: SchedulableTriggerInputTypes.DATE,
              date: new Date(fireAt),
            },
          });
        } catch {
          notificationId = null;
        }
        set((s) => ({
          items: [...s.items, { id, label, fireAt, notificationId }],
        }));
        return id;
      },
      cancelReminder: async (id) => {
        const row = get().items.find((x) => x.id === id);
        if (row?.notificationId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(row.notificationId);
          } catch {
            /* ignore */
          }
        }
        set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
      },
    }),
    { name: 'ultrago-scheduled-rides', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
