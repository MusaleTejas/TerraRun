import type { Coordinates } from "@/types";

const earthRadiusMeters = 6371000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceBetween(start: Coordinates, end: Coordinates): number {
  const deltaLatitude = toRadians(end.latitude - start.latitude);
  const deltaLongitude = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function totalPathDistance(path: Coordinates[]): number {
  return path.reduce((total, point, index) => {
    const previous = path[index - 1];

    if (!previous) {
      return total;
    }

    return total + distanceBetween(previous, point);
  }, 0);
}
