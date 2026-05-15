import { create } from 'zustand';

import type { CartLine } from '../types/food';

type FoodCartState = {
  lines: CartLine[];
  addItem: (line: Omit<CartLine, 'qty'> & { qty?: number }) => void;
  setQty: (itemId: string, restaurantId: string, qty: number) => void;
  removeLine: (itemId: string, restaurantId: string) => void;
  clear: () => void;
};

function merge(lines: CartLine[], next: CartLine): CartLine[] {
  const i = lines.findIndex((l) => l.itemId === next.itemId && l.restaurantId === next.restaurantId);
  if (i === -1) {
    return [...lines, next];
  }
  const copy = [...lines];
  copy[i] = { ...copy[i], qty: copy[i].qty + next.qty };
  return copy;
}

export const useFoodCartStore = create<FoodCartState>((set) => ({
  lines: [],
  addItem: (line) =>
    set((s) => ({
      lines: merge(s.lines, {
        ...line,
        qty: line.qty ?? 1,
      }),
    })),
  setQty: (itemId, restaurantId, qty) =>
    set((s) => ({
      lines: s.lines
        .map((l) =>
          l.itemId === itemId && l.restaurantId === restaurantId ? { ...l, qty: Math.max(0, qty) } : l,
        )
        .filter((l) => l.qty > 0),
    })),
  removeLine: (itemId, restaurantId) =>
    set((s) => ({
      lines: s.lines.filter((l) => !(l.itemId === itemId && l.restaurantId === restaurantId)),
    })),
  clear: () => set({ lines: [] }),
}));

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
}
