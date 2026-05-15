import { create } from 'zustand';

import type { Ride } from '../types/ride';

/**
 * Global ride UI: active snapshot + which ride id the rider is tracking (survives tab changes).
 * Driver uses `driverActiveRideId` for the post-accept workflow.
 */
type RideState = {
  activeRide: Ride | null;
  /** Rider Firestore listener target */
  riderTrackedRideId: string | null;
  /** Driver's accepted / in-progress ride */
  driverActiveRideId: string | null;
  setActiveRide: (ride: Ride | null) => void;
  setRiderTrackedRideId: (id: string | null) => void;
  setDriverActiveRideId: (id: string | null) => void;
  clearRiderTracking: () => void;
  clearDriverActive: () => void;
};

export const useRideStore = create<RideState>((set) => ({
  activeRide: null,
  riderTrackedRideId: null,
  driverActiveRideId: null,
  setActiveRide: (ride) => set({ activeRide: ride }),
  setRiderTrackedRideId: (id) => set({ riderTrackedRideId: id }),
  setDriverActiveRideId: (id) => set({ driverActiveRideId: id }),
  clearRiderTracking: () => set({ riderTrackedRideId: null, activeRide: null }),
  clearDriverActive: () => set({ driverActiveRideId: null }),
}));
