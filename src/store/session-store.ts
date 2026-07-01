import { create } from "zustand";

import type { TerraRunUser } from "@/types";
import { updateFirebaseProfile } from "@/lib/firebase";

const demoUser: TerraRunUser = {
  id: "demo-runner",
  displayName: "Alex Rivera",
  email: "alex@terrarun.local",
  homeCity: "San Francisco",
  totalDistanceMeters: 128420,
  territoryCount: 482,
  rank: 12,
  level: 24,
  xp: 12450,
  totalRuns: 128,
  gender: "Male",
  dob: "1998-05-12",
  age: 28,
  address: "123 Main St, San Francisco, CA",
  phoneNumber: "+1 (555) 123-4567",
  yatraColor: "#FF8A00",
};

type SessionStatus = "signedOut" | "signedIn";

type SessionState = {
  status: SessionStatus;
  user: TerraRunUser | null;
  signInWithDemoAccount: () => void;
  signInWithUser: (user: TerraRunUser) => void;
  signOut: () => void;
  updateProfile: (updates: Partial<TerraRunUser>) => void;
  addRunStats: (distanceMeters: number, cellsCapturedCount: number) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  status: "signedOut",
  user: null,
  signInWithDemoAccount: () =>
    set({
      status: "signedIn",
      user: demoUser,
    }),
  signInWithUser: (user) =>
    set({
      status: "signedIn",
      user,
    }),
  signOut: () =>
    set({
      status: "signedOut",
      user: null,
    }),
  updateProfile: (updates) =>
    set((state) => {
      if (!state.user) return {};

      // Sync changes to Firebase in the background
      updateFirebaseProfile(state.user.id, updates).catch((err) =>
        console.error("Failed to sync profile updates to Firebase:", err)
      );

      return {
        user: {
          ...state.user,
          ...updates,
        },
      };
    }),
  addRunStats: (distanceMeters, cellsCapturedCount) =>
    set((state) => {
      if (!state.user) return {};

      const currentDistance = state.user.totalDistanceMeters + distanceMeters;
      const currentCells = state.user.territoryCount + cellsCapturedCount;
      const currentRuns = (state.user.totalRuns || 0) + 1;

      // Gamification Stats Formula:
      // XP Added: 100 XP per km + 50 XP per cell captured
      const xpAdded = Math.round((distanceMeters / 1000) * 100 + cellsCapturedCount * 50);
      const currentXp = (state.user.xp || 0) + xpAdded;
      const xpPerLevel = 20000;
      
      const levelIncrease = Math.floor(currentXp / xpPerLevel);
      const newXp = currentXp % xpPerLevel;
      const newLevel = (state.user.level || 1) + levelIncrease;

      return {
        user: {
          ...state.user,
          totalDistanceMeters: currentDistance,
          territoryCount: currentCells,
          totalRuns: currentRuns,
          level: newLevel,
          xp: newXp,
        },
      };
    }),
}));
