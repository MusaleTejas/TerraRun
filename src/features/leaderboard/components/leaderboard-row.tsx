import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "@/theme";
import type { LeaderboardEntry } from "@/types";
import { formatDistance } from "@/utils";

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
};

const trendSymbol = {
  up: "↑",
  down: "↓",
  flat: "-",
} as const;

export function LeaderboardRow({ entry }: LeaderboardRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.rank}>{entry.rank}</Text>
      <View style={styles.identity}>
        <Text selectable style={styles.name}>
          {entry.displayName}
        </Text>
        <Text style={styles.city}>{entry.city}</Text>
      </View>
      <View style={styles.stats}>
        <Text style={styles.distance}>{formatDistance(entry.weeklyDistanceMeters)}</Text>
        <Text style={styles.cells}>{entry.capturedCells} cells {trendSymbol[entry.trend]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rank: {
    width: 34,
    color: colors.primary,
    fontSize: 22,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  identity: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  city: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
  stats: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  distance: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  cells: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
});
