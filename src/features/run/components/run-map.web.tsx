import React from "react";
import { StyleSheet, View, Text } from "react-native";
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
  const width = 600;
  const height = 180;
  const scale = 50000; // Mercator zoom scale factor for localized run tracking

  // Project coordinates relative to the active GPS coordinate (centered in the SVG)
  const project = (coord: Coordinates) => {
    const deltaLat = coord.latitude - gpsCoordinates.latitude;
    const deltaLng = coord.longitude - gpsCoordinates.longitude;
    return {
      x: width / 2 + deltaLng * scale * Math.cos((gpsCoordinates.latitude * Math.PI) / 180),
      y: height / 2 - deltaLat * scale,
    };
  };

  return (
    <View style={styles.mapContainer}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ backgroundColor: "#1F120F", display: "block" }}
      >
        {/* Background Grid Pattern */}
        <defs>
          <pattern id="run-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#2B1A16" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#run-grid)" />

        {/* Live Route Polyline */}
        {path.length > 1 && (
          <polyline
            points={path
              .map((pt) => {
                const proj = project(pt);
                return `${proj.x},${proj.y}`;
              })
              .join(" ")}
            fill="none"
            stroke={colors.accent}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* User Location Pulse (Center) */}
        <circle cx={width / 2} cy={height / 2} r="12" fill="rgba(58, 201, 250, 0.35)" />
        <circle cx={width / 2} cy={height / 2} r="5" fill={colors.accent} stroke="#FFFFFF" strokeWidth="1.5" />
      </svg>

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
