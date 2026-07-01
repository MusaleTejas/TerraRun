import React, { useRef, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing } from "@/theme";
import type { Coordinates } from "@/types";

type RunMapProps = {
  path: Coordinates[];
  gpsCoordinates: Coordinates;
  isSimulatorMode: boolean;
  status: string;
};

export function RunMap({ path, gpsCoordinates, isSimulatorMode, status }: RunMapProps) {
  const mapRef = useRef<MapView>(null);
  const mapCenter = path.length > 0 ? path[path.length - 1] : gpsCoordinates;

  // Center mini-map during active tracking
  useEffect(() => {
    if (status === "running" && mapRef.current) {
      mapRef.current.animateToRegion({
        ...gpsCoordinates,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [gpsCoordinates.latitude, gpsCoordinates.longitude, status]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...mapCenter,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        mapType="standard"
        pitchEnabled={false}
        rotateEnabled={false}
        customMapStyle={darkMapStyle}
      >
        {path.length > 0 && (
          <Polyline
            coordinates={path}
            strokeColor={colors.accent}
            strokeWidth={5}
          />
        )}
        <Marker coordinate={gpsCoordinates} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.locationMarker}>
            <View style={styles.markerInner} />
          </View>
        </Marker>
      </MapView>
      {isSimulatorMode && status === "running" && (
        <View style={styles.simBadge}>
          <Ionicons name="desktop-outline" size={12} color={colors.primary} />
          <Text style={styles.simText}>GPS Simulating...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 180,
    overflow: "hidden",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  locationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(58, 201, 250, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  simBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.overlay,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  simText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },
});

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0F0F10"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8e8e93"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#2c2c2e"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#161617"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1a1a1c"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8e8e93"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c2c2e"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3a3a3c"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#2c2c2e"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1c1c1e"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#091426"
      }
    ]
  }
];
