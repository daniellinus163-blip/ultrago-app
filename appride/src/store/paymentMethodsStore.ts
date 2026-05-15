import { create } from 'zustand';

import type { SavedPaymentMethod } from '../types/paymentMethod';

type PaymentMethodsState = {
  methods: SavedPaymentMethod[];
  loading: boolean;
  error: string | null;
  setMethods: (methods: SavedPaymentMethod[]) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
};

export const usePaymentMethodsStore = create<PaymentMethodsState>((set) => ({
  methods: [],
  loading: true,
  error: null,
  setMethods: (methods) => set({ methods, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

export function hasActivePaymentMethod(): boolean {
  return usePaymentMethodsStore.getState().methods.some((m) => m.status === 'active' || m.status === 'pending_verification');
}

export function getDefaultPaymentMethod(): SavedPaymentMethod | undefined {
  const { methods } = usePaymentMethodsStore.getState();
  return methods.find((m) => m.isDefault) ?? methods[0];
}
