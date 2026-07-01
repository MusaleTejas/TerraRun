import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components";
import { useSessionStore } from "@/store/session-store";
import { getNearbyCells, coordinateToCell, createPlaceholderTerritoryCell } from "@/lib/h3";
import { googleMapsConfig } from "@/lib/google-maps";
import { colors, spacing, radii } from "@/theme";
import type { Coordinates, TerritoryCell } from "@/types";

import { MapPlaceholder } from "../components/map-placeholder";
import { TerritoryCard } from "../components/territory-card";

function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout")), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function MapScreen() {
  const { user } = useSessionStore();
  const [currentLocation, setCurrentLocation] = useState<Coordinates>({
    latitude: googleMapsConfig.defaultRegion.latitude,
    longitude: googleMapsConfig.defaultRegion.longitude,
  });
  const [nearbyCells, setNearbyCells] = useState<TerritoryCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<TerritoryCell | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>("loading");
  const [loading, setLoading] = useState(false);
  const [mapLayer, setMapLayer] = useState<"standard" | "satellite">("standard");

  // Fetch user location (Actual GPS coordinates prioritized)
  useEffect(() => {
    async function initLocation() {
      setLoading(true);
      try {
        let status = "denied";
        try {
          const perm = await timeoutPromise(Location.requestForegroundPermissionsAsync(), 1500);
          status = perm.status;
          setPermissionStatus(status);
        } catch (e) {
          console.warn("Location permission request timed out, using fallback.");
        }
        
        if (status === "granted") {
          // Get actual GPS coordinates with a 2.5s timeout
          const loc = await timeoutPromise(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            2500
          );
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setCurrentLocation(coords);
          
          // Generate actual H3 cells grid around user coordinates
          const cells = getNearbyCells(coords, 3);
          setNearbyCells(cells);
          
          // Focus nearest H3 cell
          const userCellId = coordinateToCell(coords);
          const active = cells.find(c => c.h3Index === userCellId) || 
                         createPlaceholderTerritoryCell(userCellId, "demo-runner", 100);
          setSelectedCell(active);
        } else {
          // Fallback SF coordinates when permission denied
          const cells = getNearbyCells(currentLocation, 3);
          setNearbyCells(cells);
          const userCellId = coordinateToCell(currentLocation);
          const active = cells.find(c => c.h3Index === userCellId) || 
                         createPlaceholderTerritoryCell(userCellId, null, 100);
          setSelectedCell(active);
        }
      } catch (error) {
        console.warn("GPS lock timed out or failed. Defaulting to cached offline profile location.");
        // Offline / mock fallback
        const cells = getNearbyCells(currentLocation, 3);
        setNearbyCells(cells);
        const userCellId = coordinateToCell(currentLocation);
        const active = cells.find(c => c.h3Index === userCellId) || 
                       createPlaceholderTerritoryCell(userCellId, null, 100);
        setSelectedCell(active);
      } finally {
        setLoading(false);
      }
    }
    
    initLocation();
  }, []);

  const handleSelectCell = (cell: TerritoryCell) => {
    setSelectedCell(cell);
  };

  const handleStartRun = () => {
    router.push("/run");
  };

  // Convert territory count to square kilometers (approx 0.1 km² per resolution 9 H3 cell)
  const territoryAreaKm2 = ((user?.territoryCount || 0) * 0.1).toFixed(1);
  const runnerName = user?.displayName || "Samuel";
  const runnerLevel = user?.level || 24;
  const runnerRank = user?.rank || 7;

  return (
    <AppScreen contentStyle={styles.container}>
      {/* 1. Header Profile Overlay */}
      <View style={styles.headerProfileRow}>
        <View style={styles.profileDetails}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{runnerName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{runnerName}</Text>
            <Text style={styles.profileLevel}>Level {runnerLevel}</Text>
          </View>
        </View>
        <Pressable style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>3</Text>
          </View>
        </Pressable>
      </View>

      {/* 2. Map & Overlay Widgets Section */}
      <View style={styles.mapWrapper}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Acquiring GPS Signal...</Text>
          </View>
        ) : (
          <MapPlaceholder
            currentLocation={currentLocation}
            nearbyCells={nearbyCells}
            selectedCell={selectedCell}
            onSelectCell={handleSelectCell}
            playerColor={user?.yatraColor}
          />
        )}

        {/* 2a. Floating Territory Stats Card (Top Left) */}
        <View style={styles.floatingStatsCard}>
          <Text style={styles.statsLabel}>Your Territory</Text>
          <Text style={styles.statsValueKm}>{territoryAreaKm2} <Text style={styles.kmUnit}>km²</Text></Text>
          <Text style={styles.rankLabel}>Rank</Text>
          <Text style={styles.rankValue}>#{runnerRank}</Text>
        </View>

        {/* 2b. Floating Right Action Icons */}
        <View style={styles.rightOverlayControls}>
          <Pressable 
            style={({ pressed }) => [styles.sideIconButton, pressed && styles.btnPressed]}
            onPress={() => {
              // Recenter map on user actual location
              Location.getCurrentPositionAsync({}).then((loc) => {
                setCurrentLocation({
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                });
              }).catch(() => {});
            }}
          >
            <Ionicons name="locate" size={20} color={colors.text} />
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.sideIconButton, pressed && styles.btnPressed]}
            onPress={() => setMapLayer(mapLayer === "standard" ? "satellite" : "standard")}
          >
            <Ionicons name="layers" size={20} color={colors.text} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sideIconButton, pressed && styles.btnPressed]}>
            <Ionicons name="compass" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* 2c. Floating Start Run Button FAB (Bottom Center) */}
        <Pressable
          style={({ pressed }) => [styles.startRunFab, pressed && styles.fabPressed]}
          onPress={handleStartRun}
          accessibilityLabel="Start Run session"
        >
          <Ionicons name="play" size={16} color={colors.text} style={styles.playIcon} />
          <Text style={styles.startRunText}>Start Run</Text>
        </Pressable>
      </View>

      {/* 3. Selected Sector Info Panel */}
      {selectedCell && (
        <TerritoryCard cell={selectedCell} />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
    gap: spacing.md,
  },
  headerProfileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  profileDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  profileName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  profileLevel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "900",
  },
  mapWrapper: {
    position: "relative",
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  loaderContainer: {
    height: 380,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  loaderText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  floatingStatsCard: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: "rgba(36, 22, 19, 0.82)", // Transparent Surface
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    minWidth: 124,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  statsLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statsValueKm: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  kmUnit: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  rankLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rankValue: {
    color: colors.accent, // Purple rank accent
    fontSize: 18,
    fontWeight: "900",
  },
  rightOverlayControls: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
  },
  sideIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(36, 22, 19, 0.88)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  btnPressed: {
    opacity: 0.8,
  },
  startRunFab: {
    position: "absolute",
    bottom: spacing.lg,
    left: "50%",
    transform: [{ translateX: -70 }], // Center FAB button
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ translateX: -70 }, { scale: 0.97 }],
  },
  playIcon: {
    marginRight: spacing.sm,
  },
  startRunText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
