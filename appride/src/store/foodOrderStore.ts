import { create } from 'zustand';

import type { FoodOrder } from '../types/food';

type OrderState = {
  orders: FoodOrder[];
  addOrder: (o: FoodOrder) => void;
  updateOrder: (id: string, patch: Partial<FoodOrder>) => void;
  claimDelivery: (orderId: string, riderId: string) => void;
};

export const useFoodOrderStore = create<OrderState>((set) => ({
  orders: [],
  addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
  updateOrder: (id, patch) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),
  claimDelivery: (orderId, riderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && o.status === 'preparing' && !o.deliveryRiderId
          ? { ...o, deliveryRiderId: riderId, status: 'out_for_delivery' }
          : o,
      ),
    })),
}));
