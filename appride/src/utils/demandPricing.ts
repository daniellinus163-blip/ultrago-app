/**
 * Phase 7 — demand-based fare multiplier (client-side heuristic).
 * Production apps combine surge zones, forecast models, and server authority.
 */
export function getDemandMultiplier(now: Date, nearbyOnlineDriverCount: number): number {
  const hour = now.getHours();
  const weekday = now.getDay() >= 1 && now.getDay() <= 5;
  const morningPeak = weekday && hour >= 7 && hour <= 9;
  const eveningPeak = weekday && hour >= 16 && hour <= 19;
  const weekendPeak = !weekday && hour >= 11 && hour <= 14;
  let m = 1;
  if (morningPeak || eveningPeak) {
    m += 0.1;
  } else if (weekendPeak) {
    m += 0.06;
  }
  if (nearbyOnlineDriverCount <= 2) {
    m += 0.12;
  } else if (nearbyOnlineDriverCount <= 5) {
    m += 0.06;
  }
  return Math.min(1.35, Math.round(m * 100) / 100);
}

export function formatDemandLabel(mult: number): string {
  if (mult <= 1.01) {
    return 'Standard pricing';
  }
  if (mult <= 1.12) {
    return 'Light demand';
  }
  return 'Peak demand';
}
