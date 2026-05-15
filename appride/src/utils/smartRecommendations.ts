import { MOCK_RESTAURANTS } from '../data/mockRestaurants';

type Args = {
  foodFavoriteIds: string[];
  loyaltyPoints: number;
};

/**
 * Lightweight “AI-style” suggestion — deterministic heuristics over local signals (Phase 7).
 */
export function buildSmartRideTip({ foodFavoriteIds, loyaltyPoints }: Args): string | null {
  if (foodFavoriteIds.length > 0) {
    const r = MOCK_RESTAURANTS.find((x) => foodFavoriteIds.includes(x.id));
    if (r) {
      return `After your ride, ${r.name} is trending in your favorites — quick bite nearby.`;
    }
  }
  if (loyaltyPoints >= 200) {
    return 'Gold-tier riders get priority matching in busy periods — keep completing trips.';
  }
  const pick = MOCK_RESTAURANTS[Math.abs(loyaltyPoints) % MOCK_RESTAURANTS.length];
  return `Popular tonight: ${pick.name} · ${pick.tagline}`;
}
