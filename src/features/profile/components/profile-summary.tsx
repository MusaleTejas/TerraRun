import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SectionCard } from "@/components";
import { colors, spacing, typography, radii } from "@/theme";
import type { TerraRunUser } from "@/types";
import { formatCompactNumber, formatDistance } from "@/utils";

type ProfileSummaryProps = {
  user: TerraRunUser;
};

export function ProfileSummary({ user }: ProfileSummaryProps) {
  const runnerName = user.displayName;
  const runnerLevel = user.level || 24;
  const currentXp = user.xp || 12450;
  const xpThreshold = 20000;
  const progressPercent = Math.min(Math.max((currentXp / xpThreshold) * 100, 0), 100);

  // Convert territory cells to square kilometers (approx 0.1 km² per cell)
  const territoryAreaKm2 = ((user.territoryCount || 0) * 0.1).toFixed(1);

  return (
    <SectionCard style={styles.card}>
      {/* User Basic Info Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{runnerName.charAt(0)}</Text>
        </View>
        <View style={styles.identity}>
          <Text selectable style={styles.name}>
            {runnerName}
          </Text>
          <Text style={styles.levelText}>Level {runnerLevel}</Text>
        </View>
      </View>

      {/* Gamified XP Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressBarActive, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.xpLabelsRow}>
          <Text style={styles.xpText}>
            {currentXp.toLocaleString()} / {xpThreshold.toLocaleString()} XP
          </Text>
        </View>
      </View>

      {/* Row Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.value}>{user.totalRuns || 128}</Text>
          <Text style={styles.label}>Total Runs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.value}>
            {user.totalDistanceMeters > 1000 
              ? (user.totalDistanceMeters / 1000).toFixed(0) + " km"
              : Math.round(user.totalDistanceMeters) + " m"}
          </Text>
          <Text style={styles.label}>Distance</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.value}>{territoryAreaKm2} km²</Text>
          <Text style={styles.label}>Territory</Text>
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  avatarText: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  identity: {
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  levelText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  progressSection: {
    gap: spacing.xs,
  },
  progressBarWrapper: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressBarActive: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.primary, // Orange progress bar
  },
  xpLabelsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  xpText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  label: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
