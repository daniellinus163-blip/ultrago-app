import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SavedCard, WalletTransaction } from '../types/wallet';

type WalletState = {
  balance: number;
  cards: SavedCard[];
  transactions: WalletTransaction[];
  /** Single-use % off next food checkout (from promo codes). */
  foodPromoPercent: number | null;
  /** Single-use % off next ride fare (from promo codes). */
  ridePromoPercent: number | null;
  applyPromoCode: (raw: string) => { ok: boolean; message: string };
  clearFoodPromo: () => void;
  clearRidePromo: () => void;
  addCard: (card: Omit<SavedCard, 'id'>) => void;
  removeCard: (id: string) => void;
  topUp: (amount: number) => void;
  /** Returns false if insufficient balance (caller should alert). */
  chargeRide: (amount: number, rideId: string, title: string) => boolean;
  /** Returns false if insufficient balance. */
  chargeFood: (amount: number, orderId: string, title: string) => boolean;
  discountedFoodTotal: (subtotal: number, delivery: number) => { discount: number; total: number };
  discountedRideFare: (baseFare: number) => { discount: number; fare: number };
};

function txId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      cards: [],
      transactions: [],
      foodPromoPercent: null,
      ridePromoPercent: null,

      applyPromoCode: (raw) => {
        const code = raw.trim().toUpperCase();
        if (code === 'WELCOME10') {
          set({ foodPromoPercent: 10 });
          return { ok: true, message: '10% off your next food order (applied at checkout).' };
        }
        if (code === 'RIDER5') {
          set({ ridePromoPercent: 5 });
          return { ok: true, message: '5% off your next ride (applied when you request).' };
        }
        if (code === 'BONUS5') {
          set((s) => {
            const credit = 5;
            return {
              balance: s.balance + credit,
              transactions: [
                {
                  id: txId(),
                  at: Date.now(),
                  kind: 'promo_credit',
                  title: 'Promo credit · BONUS5',
                  amount: credit,
                },
                ...s.transactions,
              ],
            };
          });
          return { ok: true, message: '$5.00 added to your wallet.' };
        }
        return { ok: false, message: 'That code is not valid right now.' };
      },

      clearFoodPromo: () => set({ foodPromoPercent: null }),
      clearRidePromo: () => set({ ridePromoPercent: null }),

      addCard: (card) =>
        set((s) => ({
          cards: [...s.cards, { ...card, id: `card-${Date.now()}` }],
        })),

      removeCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),

      topUp: (amount) => {
        if (amount <= 0) {
          return;
        }
        set((s) => ({
          balance: s.balance + amount,
          transactions: [
            {
              id: txId(),
              at: Date.now(),
              kind: 'top_up',
              title: 'Wallet top-up',
              amount,
            },
            ...s.transactions,
          ],
        }));
      },

      discountedFoodTotal: (subtotal, delivery) => {
        const pct = get().foodPromoPercent ?? 0;
        const discount = pct ? Math.round(subtotal * (pct / 100) * 100) / 100 : 0;
        const total = Math.max(0, subtotal - discount + delivery);
        return { discount, total };
      },

      discountedRideFare: (baseFare) => {
        const pct = get().ridePromoPercent ?? 0;
        const discount = pct ? Math.round(baseFare * (pct / 100) * 100) / 100 : 0;
        const fare = Math.max(0, baseFare - discount);
        return { discount, fare };
      },

      chargeRide: (amount, rideId, title) => {
        if (amount <= 0) {
          return true;
        }
        const b = get().balance;
        if (b < amount) {
          return false;
        }
        set((s) => ({
          balance: s.balance - amount,
          ridePromoPercent: null,
          transactions: [
            {
              id: txId(),
              at: Date.now(),
              kind: 'ride',
              title,
              amount: -amount,
              refId: rideId,
            },
            ...s.transactions,
          ],
        }));
        return true;
      },

      chargeFood: (amount, orderId, title) => {
        if (amount <= 0) {
          return true;
        }
        const b = get().balance;
        if (b < amount) {
          return false;
        }
        set((s) => ({
          balance: s.balance - amount,
          foodPromoPercent: null,
          transactions: [
            {
              id: txId(),
              at: Date.now(),
              kind: 'food',
              title,
              amount: -amount,
              refId: orderId,
            },
            ...s.transactions,
          ],
        }));
        return true;
      },
    }),
    {
      name: 'ultrago-wallet-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        balance: s.balance,
        cards: s.cards,
        transactions: s.transactions.slice(0, 80),
        foodPromoPercent: s.foodPromoPercent,
        ridePromoPercent: s.ridePromoPercent,
      }),
    },
  ),
);
