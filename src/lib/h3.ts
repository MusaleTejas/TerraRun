import "./h3-polyfill";
import { cellToLatLng, latLngToCell, cellToBoundary, gridDisk } from "h3-js";

import type { Coordinates, TerritoryCell } from "@/types";

export const H3_RESOLUTION = 9;

export function coordinateToCell(coordinates: Coordinates, resolution = H3_RESOLUTION): string {
  return latLngToCell(coordinates.latitude, coordinates.longitude, resolution);
}

export function cellToCenter(h3Index: string): Coordinates {
  const [latitude, longitude] = cellToLatLng(h3Index);

  return { latitude, longitude };
}

export function getCellBoundary(h3Index: string): Coordinates[] {
  try {
    const boundary = cellToBoundary(h3Index);
    return boundary.map(([latitude, longitude]) => ({ latitude, longitude }));
  } catch (error) {
    console.error("Failed to get boundary for cell", h3Index, error);
    return [];
  }
}

export function createPlaceholderTerritoryCell(
  h3Index: string,
  ownerId: string | null,
  score: number,
): TerritoryCell {
  return {
    h3Index,
    ownerId,
    score,
    center: cellToCenter(h3Index),
  };
}

export function getNearbyCells(center: Coordinates, radius = 2): TerritoryCell[] {
  try {
    const centerIndex = coordinateToCell(center);
    const disk = gridDisk(centerIndex, radius);
    
    // Create mock owner distribution for placeholder experience
    return disk.map((index) => {
      // Deterministic owner and score based on index hashes to keep it persistent for a session
      const charCodeSum = index.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const isOwned = charCodeSum % 3 === 0;
      const isUserOwned = charCodeSum % 6 === 0;
      
      let ownerId: string | null = null;
      if (isUserOwned) {
        ownerId = "demo-runner";
      } else if (isOwned) {
        ownerId = charCodeSum % 2 === 0 ? "runner-1" : "runner-2";
      }
      
      const score = 50 + (charCodeSum % 151); // 50 to 200 pts
      
      return createPlaceholderTerritoryCell(index, ownerId, score);
    });
  } catch (error) {
    console.error("Failed to generate nearby H3 cells grid", error);
    return [];
  }
}

