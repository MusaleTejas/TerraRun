import type { Coordinates } from "@/types";

export const googleMapsConfig = {
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  defaultRegion: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.032,
    longitudeDelta: 0.032,
  },
} as const;

export function isGoogleMapsConfigured(): boolean {
  return googleMapsConfig.apiKey.length > 0;
}

export function createStaticMapUrl(center: Coordinates, zoom = 14): string | null {
  if (!isGoogleMapsConfigured()) {
    return null;
  }

  const latitude = center.latitude;
  const longitude = center.longitude;

  return (
    "https://maps.googleapis.com/maps/api/staticmap" +
    "?center=" + latitude + "," + longitude +
    "&zoom=" + zoom +
    "&size=640x360&maptype=roadmap&key=" + googleMapsConfig.apiKey
  );
}
