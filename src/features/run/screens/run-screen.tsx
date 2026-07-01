import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, Switch, Pressable } from "react-native";
import { RunMap } from "../components/run-map";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen, MetricCard, ScreenHeader, SectionCard, StatusPill } from "@/components";
import { useRunStore } from "@/store/run-store";
import { googleMapsConfig } from "@/lib/google-maps";
import { coordinateToCell } from "@/lib/h3";
import { colors, spacing, radii } from "@/theme";
import { formatDistance, formatDuration, formatPace } from "@/utils";
import type { Coordinates } from "@/types";

import { RunControls } from "../components/run-controls";

const BACKGROUND_LOCATION_TASK = "terrarun-bg-location";

// Register background task globally
try {
  if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
      if (error) {
        console.error("Background tracking task error:", error);
        return;
      }
      if (data) {
        const { locations } = data as any;
        if (locations && locations.length > 0) {
          const loc = locations[0];
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          
          const store = useRunStore.getState();
          if (store.status === "running") {
            store.appendPoint(coords);
            const cell = coordinateToCell(coords);
            store.addCapturedCell(cell);
          }
        }
      }
    });
  }
} catch (e) {
  console.warn("Could not register background task, might be on web or not supported in this shell", e);
}

export function RunScreen() {
  const {
    status,
    elapsedSeconds,
    path,
    capturedCells,
    startRun,
    pauseRun,
    resumeRun,
    completeRun,
    resetRun,
    appendPoint,
    incrementDuration,
    addCapturedCell,
  } = useRunStore();

  const [isSimulatorMode, setIsSimulatorMode] = useState<boolean>(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<Coordinates>({
    latitude: googleMapsConfig.defaultRegion.latitude,
    longitude: googleMapsConfig.defaultRegion.longitude,
  });

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const simIntervalRef = useRef<any>(null);

  // Initialize start coordinate
  useEffect(() => {
    async function fetchInitialLocation() {
      try {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
        if (permStatus === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const initialCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setGpsCoordinates(initialCoords);
        }
      } catch (err) {
        console.warn("Could not get initial run coordinates", err);
      }
    }
    fetchInitialLocation();
  }, []);

  // Timer interval to increment running duration seconds
  useEffect(() => {
    if (status === "running") {
      timerIntervalRef.current = setInterval(() => {
        incrementDuration(1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [status]);

  // Real location tracking and Background GPS configuration
  useEffect(() => {
    async function startRealTracking() {
      if (status === "running" && !isSimulatorMode) {
        try {
          const { status: foreStatus } = await Location.requestForegroundPermissionsAsync();
          if (foreStatus !== "granted") {
            console.warn("Foreground location denied");
            return;
          }

          // Request background permissions for background GPS
          const { status: backStatus } = await Location.requestBackgroundPermissionsAsync();
          
          // Start foreground watcher
          locationSubscriptionRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 3000,
              distanceInterval: 5,
            },
            (location) => {
              const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };
              setGpsCoordinates(coords);
              appendPoint(coords);
              const cell = coordinateToCell(coords);
              addCapturedCell(cell);
            }
          );

          // Start background tracking updates
          if (backStatus === "granted" && TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 5000,
              distanceInterval: 10,
              foregroundService: {
                notificationTitle: "TerraRun capture active",
                notificationBody: "Tracking territory path in background.",
                notificationColor: colors.primary,
              },
            });
          }
        } catch (err) {
          console.error("Failed to setup real GPS tracking:", err);
        }
      } else {
        stopRealTracking();
      }
    }

    startRealTracking();

    return () => {
      stopRealTracking();
    };
  }, [status, isSimulatorMode]);

  const stopRealTracking = async () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (e) {}
  };

  // Simulator mode track simulation
  useEffect(() => {
    if (status === "running" && isSimulatorMode) {
      let stepCount = path.length > 0 ? path.length : 0;
      let startCoords = path.length > 0 ? path[path.length - 1] : gpsCoordinates;

      simIntervalRef.current = setInterval(() => {
        stepCount += 1;
        
        // Add step vectors heading North-East with natural jitter
        const offsetLat = 0.00018 + (Math.random() - 0.5) * 0.00004;
        const offsetLng = 0.00022 + (Math.random() - 0.5) * 0.00004;
        
        const nextCoords = {
          latitude: startCoords.latitude + offsetLat,
          longitude: startCoords.longitude + offsetLng,
        };

        startCoords = nextCoords;
        setGpsCoordinates(nextCoords);
        appendPoint(nextCoords);

        // Convert path point to H3 cell and add it to captures
        const cell = coordinateToCell(nextCoords);
        addCapturedCell(cell);
      }, 3000);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [status, isSimulatorMode]);



  // Metrics Calculations
  // Total Distance
  const distanceMeters = path.reduce((total, pt, index) => {
    if (index === 0) return total;
    const prev = path[index - 1];
    
    // Haversine distance
    const earthRadius = 6371000;
    const dLat = ((pt.latitude - prev.latitude) * Math.PI) / 180;
    const dLon = ((pt.longitude - prev.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((prev.latitude * Math.PI) / 180) *
        Math.cos((pt.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return total + earthRadius * c;
  }, 0);

  const paceSecondsPerKm = distanceMeters > 0 ? elapsedSeconds / (distanceMeters / 1000) : 0;
  
  // Dynamic Calorie calculation: weight (75kg) * distance (km) * 1.036
  const caloriesBurned = Math.round((distanceMeters / 1000) * 75 * 1.036);

  const mapCenter = path.length > 0 ? path[path.length - 1] : gpsCoordinates;

  return (
    <AppScreen contentStyle={styles.container}>
      <ScreenHeader
        eyebrow="Live Run Session"
        title="Run & Capture Grid"
        subtitle="Capture H3 cell sectors in real-time as you navigate. Syncs on completion."
      />

      <View style={styles.statusRow}>
        <StatusPill
          label={status.toUpperCase()}
          tone={
            status === "running"
              ? "success"
              : status === "paused"
              ? "warning"
              : "accent"
          }
        />
        <View style={styles.simulatorToggle}>
          <Text style={styles.toggleText}>Simulator Mode</Text>
          <Switch
            value={isSimulatorMode}
            onValueChange={setIsSimulatorMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isSimulatorMode ? colors.text : colors.mutedText}
            disabled={status === "running"}
          />
        </View>
      </View>

      {/* Mini Run Route Map */}
      <RunMap
        path={path}
        gpsCoordinates={gpsCoordinates}
        isSimulatorMode={isSimulatorMode}
        status={status}
      />

      {/* 1. Large Distance Display Header Overlay */}
      <View style={styles.largeDistanceContainer}>
        <Text style={styles.largeDistanceValue}>{(distanceMeters / 1000).toFixed(2)}</Text>
        <Text style={styles.largeDistanceUnit}>km</Text>
      </View>

      {/* 2. Three Stats Strip Row */}
      <View style={styles.statsStripRow}>
        <View style={styles.statStripItem}>
          <Text style={styles.statStripValue}>{formatDuration(elapsedSeconds)}</Text>
          <Text style={styles.statStripLabel}>Time</Text>
        </View>
        <View style={styles.statStripItem}>
          <Text style={styles.statStripValue}>
            {paceSecondsPerKm > 0
              ? `${Math.floor(paceSecondsPerKm / 60)}'${Math.round(paceSecondsPerKm % 60)}"`
              : `0'00"`}
          </Text>
          <Text style={styles.statStripLabel}>Pace</Text>
        </View>
        <View style={styles.statStripItem}>
          <Text style={styles.statStripValue}>{caloriesBurned}</Text>
          <Text style={styles.statStripLabel}>Calories</Text>
        </View>
      </View>

      {/* Controls Container */}
      <SectionCard style={styles.controlsCard}>
        <RunControls
          status={status}
          onComplete={completeRun}
          onPause={pauseRun}
          onReset={resetRun}
          onResume={resumeRun}
          onStart={startRun}
        />
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  simulatorToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  toggleText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
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
  metrics: {
    flexDirection: "row",
    gap: spacing.md,
  },
  controlsCard: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  largeDistanceContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  largeDistanceValue: {
    color: colors.primary,
    fontSize: 54,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  largeDistanceUnit: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: -4,
  },
  statsStripRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
    marginVertical: spacing.sm,
  },
  statStripItem: {
    flex: 1,
    alignItems: "center",
  },
  statStripValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  statStripLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
});
