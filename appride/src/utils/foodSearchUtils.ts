import type { Restaurant } from '../types/food';

export type FoodSearchSuggestion = { label: string; restaurantId: string; kind: 'restaurant' | 'menu' };

/** Lightweight “AI-style” autocomplete over local catalog (no remote LLM). */
export function buildFoodSearchSuggestions(query: string, rows: Restaurant[], limit = 8): FoodSearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return [];
  }
  const out: FoodSearchSuggestion[] = [];
  for (const r of rows) {
    if (r.name.toLowerCase().includes(q)) {
      out.push({ label: r.name, restaurantId: r.id, kind: 'restaurant' });
    }
    for (const m of r.menu) {
      if (m.name.toLowerCase().includes(q)) {
        out.push({ label: `${m.name} · ${r.name}`, restaurantId: r.id, kind: 'menu' });
      }
    }
    if (out.length >= limit) {
      break;
    }
  }
  return out.slice(0, limit);
}
