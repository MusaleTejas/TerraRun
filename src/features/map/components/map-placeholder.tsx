import React, { useRef, useEffect } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import MapView, { Polygon, Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import { googleMapsConfig } from "@/lib/google-maps";
import { getCellBoundary } from "@/lib/h3";
import { colors, radii, spacing } from "@/theme";
import type { Coordinates, TerritoryCell } from "@/types";

type MapPlaceholderProps = {
  currentLocation: Coordinates;
  nearbyCells: TerritoryCell[];
  selectedCell: TerritoryCell | null;
  onSelectCell: (cell: TerritoryCell) => void;
  runPath?: Coordinates[];
  isTracking?: boolean;
  playerColor?: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function MapPlaceholder({
  currentLocation,
  nearbyCells,
  selectedCell,
  onSelectCell,
  runPath = [],
  isTracking = false,
  playerColor = "#FF8A00",
}: MapPlaceholderProps) {
  const mapRef = useRef<MapView>(null);

  // Recenter map on location change if tracking
  useEffect(() => {
    if (isTracking && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);
    }
  }, [currentLocation.latitude, currentLocation.longitude, isTracking]);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...currentLocation,
          latitudeDelta: googleMapsConfig.defaultRegion.latitudeDelta,
          longitudeDelta: googleMapsConfig.defaultRegion.longitudeDelta,
        }}
        showsUserLocation={false}
        mapType="standard"
        pitchEnabled={true}
        rotateEnabled={true}
        customMapStyle={darkMapStyle}
      >
        {/* Render surrounding H3 cell hexagons */}
        {nearbyCells.map((cell) => {
          const boundary = getCellBoundary(cell.h3Index);
          if (boundary.length === 0) return null;

          const isSelected = selectedCell?.h3Index === cell.h3Index;
          const isUserOwned = cell.ownerId === "demo-runner";
          const isRivalOwned = cell.ownerId && !isUserOwned;

          let fillColor = "rgba(58, 201, 250, 0.06)"; // Allies/Neutral: Blue
          let strokeColor = "rgba(58, 201, 250, 0.25)";
          let strokeWidth = 1;

          if (isUserOwned) {
            // Player: Custom Yatra Color
            fillColor = hexToRgba(playerColor, 0.22);
            strokeColor = playerColor;
          } else if (isRivalOwned) {
            // Enemy: Purple
            fillColor = "rgba(99, 82, 202, 0.18)";
            strokeColor = colors.accent;
          }

          if (isSelected) {
            strokeColor = colors.text;
            strokeWidth = 2.5;
          }

          return (
            <Polygon
              key={cell.h3Index}
              coordinates={boundary}
              fillColor={fillColor}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              tappable={true}
              onPress={() => onSelectCell(cell)}
            />
          );
        })}

        {/* Render run path polyline */}
        {runPath.length > 0 && (
          <Polyline
            coordinates={runPath}
            strokeColor={colors.accent}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* User Location Marker */}
        <Marker
          coordinate={currentLocation}
          title="Your Location"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.pulseContainer}>
            <View style={styles.pulseOuter} />
            <View style={styles.pulseInner} />
          </View>
        </Marker>
      </MapView>

      {/* Map Actions Overlay */}
      <View style={styles.actionsOverlay}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={handleRecenter}
          accessibilityLabel="Recenter map"
        >
          <Ionicons name="locate" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 380,
    overflow: "hidden",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: {
    flex: 1,
  },
  pulseContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
  },
  pulseInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
  },
  pulseOuter: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(58, 201, 250, 0.4)",
  },
  actionsOverlay: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
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
