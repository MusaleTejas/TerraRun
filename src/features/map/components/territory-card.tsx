import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SectionCard } from "@/components";
import { colors, spacing, typography, radii } from "@/theme";
import type { TerritoryCell } from "@/types";

type TerritoryCardProps = {
  cell: TerritoryCell;
};

export function TerritoryCard({ cell }: TerritoryCardProps) {
  const isUserOwned = cell.ownerId === "demo-runner";
  const isRivalOwned = cell.ownerId && !isUserOwned;

  let title = "Neutral Sector";
  let statusText = "Unclaimed territory. Run here to secure it.";
  let badgeColor: string = colors.accent;
  let iconName = "contract-outline";

  if (isUserOwned) {
    title = "Secured Sector";
    statusText = "You own this territory! Keep running to maintain control.";
    badgeColor = colors.success;
    iconName = "shield-checkmark-outline";
  } else if (isRivalOwned) {
    title = "Contested Sector";
    statusText = `Claimed by runner ${cell.ownerId}. Capture it!`;
    badgeColor = colors.primary;
    iconName = "flag-outline";
  }

  return (
    <SectionCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.badge, { backgroundColor: badgeColor + "20", borderColor: badgeColor }]}>
            <Ionicons name={iconName as any} size={16} color={badgeColor} />
            <Text style={[styles.badgeText, { color: badgeColor }]}>{title}</Text>
          </View>
          <Text selectable style={styles.index}>
            {cell.h3Index}
          </Text>
        </View>
        <Text style={styles.score}>{cell.score} pts</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.footer}>
        <Text style={styles.meta}>{statusText}</Text>
        <Text style={styles.coords}>
          Lat: {cell.center.latitude.toFixed(5)}, Lng: {cell.center.longitude.toFixed(5)}
        </Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  titleRow: {
    gap: spacing.sm,
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  score: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  index: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "System",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  footer: {
    gap: spacing.xs,
  },
  meta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  coords: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "500",
  },
});
