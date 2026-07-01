import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  const width = 600;
  const height = 380;
  const scale = 40000; // Mercator scaling factor for resolution 9 cells zoom

  // Coordinate projector helper to project GPS points to SVG viewport coordinates
  const project = (coord: Coordinates) => {
    const deltaLat = coord.latitude - currentLocation.latitude;
    const deltaLng = coord.longitude - currentLocation.longitude;
    return {
      x: width / 2 + deltaLng * scale * Math.cos((currentLocation.latitude * Math.PI) / 180),
      y: height / 2 - deltaLat * scale,
    };
  };

  const handleRecenter = () => {
    console.log("Web map simulated center reset");
  };

  return (
    <View style={styles.container}>
      {/* SVG Canvas to render hexagons and paths natively on web without react-native-maps crashes */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ backgroundColor: colors.background, display: "block" }}
      >
        {/* Background Grid Pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={colors.border} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Captured & Unclaimed Hexagon Polygons */}
        {nearbyCells.map((cell) => {
          const boundary = getCellBoundary(cell.h3Index);
          if (boundary.length === 0) return null;

          const pointsStr = boundary
            .map((pt) => {
              const proj = project(pt);
              return `${proj.x},${proj.y}`;
            })
            .join(" ");

          const isSelected = selectedCell?.h3Index === cell.h3Index;
          const isUserOwned = cell.ownerId === "demo-runner";
          const isRivalOwned = cell.ownerId && !isUserOwned;

          // Default Unclaimed / Ally: Blue
          let fill = "rgba(58, 201, 250, 0.06)";
          let stroke = "rgba(58, 201, 250, 0.25)";
          let strokeWidth = "1";

          if (isUserOwned) {
            // Player: Custom Yatra Color
            fill = hexToRgba(playerColor, 0.22);
            stroke = playerColor;
          } else if (isRivalOwned) {
            // Enemy: Purple
            fill = "rgba(99, 82, 202, 0.18)";
            stroke = colors.accent;
          }

          if (isSelected) {
            stroke = "#FFFFFF";
            strokeWidth = "2.5";
          }

          return (
            <polygon
              key={cell.h3Index}
              points={pointsStr}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              style={{ cursor: "pointer", transition: "all 0.15s ease" }}
              onClick={() => onSelectCell(cell)}
            />
          );
        })}

        {/* Live Route Polyline */}
        {runPath.length > 1 && (
          <polyline
            points={runPath
              .map((pt) => {
                const proj = project(pt);
                return `${proj.x},${proj.y}`;
              })
              .join(" ")}
            fill="none"
            stroke={colors.accent}
            strokeWidth="4"
            strokeDasharray="2,2"
          />
        )}

        {/* Active Location Indicator */}
        <circle cx={width / 2} cy={height / 2} r="14" fill="rgba(58, 201, 250, 0.35)" />
        <circle cx={width / 2} cy={height / 2} r="6" fill={colors.accent} stroke="#FFFFFF" strokeWidth="2" />
      </svg>

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
