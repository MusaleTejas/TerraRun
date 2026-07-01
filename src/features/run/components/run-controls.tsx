import React, { useState } from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radii } from "@/theme";
import type { RunStatus } from "@/types";

type RunControlsProps = {
  status: RunStatus;
  onComplete: () => void;
  onPause: () => void;
  onReset: () => void;
  onResume: () => void;
  onStart: () => void;
};

export function RunControls({
  onComplete,
  onPause,
  onReset,
  onResume,
  onStart,
  status,
}: RunControlsProps) {
  const [isLocked, setIsLocked] = useState(false);

  const handleLockToggle = () => {
    setIsLocked(!isLocked);
  };

  if (status === "ready" || status === "idle") {
    return (
      <View style={styles.centerContainer}>
        <Pressable
          style={({ pressed }) => [styles.bigPlayButton, pressed && styles.pressed]}
          onPress={onStart}
          accessibilityLabel="Start Run session"
        >
          <Ionicons name="play" size={32} color={colors.text} />
        </Pressable>
        <Text style={styles.helperText}>Tap to Start Run</Text>
      </View>
    );
  }

  return (
    <View style={styles.controlsRow}>
      {/* 1. Left Action: Circular Lock Button */}
      <Pressable
        style={({ pressed }) => [
          styles.circularButton,
          isLocked && styles.activeLockedButton,
          pressed && styles.pressed,
        ]}
        onPress={handleLockToggle}
        accessibilityLabel={isLocked ? "Unlock controls" : "Lock controls"}
      >
        <Ionicons 
          name={isLocked ? "lock-closed" : "lock-open-outline"} 
          size={20} 
          color={isLocked ? colors.primary : colors.text} 
        />
      </Pressable>

      {/* 2. Center Action: Circular Main Control (Pause/Resume) */}
      {status === "running" ? (
        <Pressable
          style={({ pressed }) => [
            styles.largePauseButton,
            isLocked && styles.disabledButton,
            pressed && !isLocked && styles.pressed,
          ]}
          onPress={onPause}
          disabled={isLocked}
          accessibilityLabel="Pause Run"
        >
          <Ionicons name="pause" size={28} color={colors.text} />
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.largePauseButton,
            isLocked && styles.disabledButton,
            pressed && !isLocked && styles.pressed,
          ]}
          onPress={onResume}
          disabled={isLocked}
          accessibilityLabel="Resume Run"
        >
          <Ionicons name="play" size={28} color={colors.text} />
        </Pressable>
      )}

      {/* 3. Right Action: Circular Finish / Reset Button */}
      {status === "completed" ? (
        <Pressable
          style={({ pressed }) => [styles.circularButton, pressed && styles.pressed]}
          onPress={onReset}
          accessibilityLabel="Reset Run session"
        >
          <Ionicons name="refresh-outline" size={20} color={colors.text} />
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.circularButton,
            isLocked && styles.disabledButton,
            pressed && !isLocked && styles.pressed,
          ]}
          onPress={onComplete}
          disabled={isLocked}
          accessibilityLabel="Complete Run"
        >
          <Ionicons name="flag" size={20} color={colors.text} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  bigPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  helperText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: spacing.sm,
  },
  circularButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activeLockedButton: {
    borderColor: colors.primary,
    backgroundColor: "rgba(220, 142, 71, 0.1)",
  },
  largePauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
