import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components";
import { useSessionStore } from "@/store/session-store";
import { colors, spacing, radii } from "@/theme";
import type { LeaderboardEntry } from "@/types";

import { LeaderboardRow } from "../components/leaderboard-row";

const baseRivals = [
  { id: "rival-1", displayName: "Maya Chen", city: "San Francisco", distance: 152000, cells: 528, trend: "up" as const },
  { id: "rival-2", displayName: "Noah Singh", city: "Oakland", distance: 135000, cells: 489, trend: "flat" as const },
  { id: "rival-3", displayName: "Elena Rostova", city: "San Francisco", distance: 115000, cells: 410, trend: "up" as const },
  { id: "rival-4", displayName: "Marcus Vance", city: "San Francisco", distance: 98000, cells: 320, trend: "down" as const },
  { id: "rival-5", displayName: "Kenji Sato", city: "San Jose", distance: 88000, cells: 290, trend: "flat" as const },
];

export function LeaderboardScreen() {
  const { user } = useSessionStore();
  const [scope, setScope] = useState<"global" | "local">("global");
  const [metric, setMetric] = useState<"distance" | "cells">("distance");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Simulated pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  // Compile active user + rivals
  const allEntries = [...baseRivals];
  if (user) {
    allEntries.push({
      id: user.id,
      displayName: user.displayName,
      city: user.homeCity,
      distance: user.totalDistanceMeters,
      cells: user.territoryCount,
      trend: "up" as const,
    });
  }

  // Filter by City scope
  const scopedEntries = allEntries.filter((item) => {
    if (scope === "local" && user) {
      return item.city.toLowerCase() === user.homeCity.toLowerCase();
    }
    return true;
  });

  // Sort and assign ranks
  const sortedEntries = scopedEntries.sort((a, b) => {
    if (metric === "distance") {
      return b.distance - a.distance;
    } else {
      return b.cells - a.cells;
    }
  });

  const rankedEntries: LeaderboardEntry[] = sortedEntries.map((entry, index) => ({
    id: entry.id,
    displayName: entry.displayName,
    city: entry.city,
    rank: index + 1,
    weeklyDistanceMeters: entry.distance,
    capturedCells: entry.cells,
    trend: entry.trend,
  }));

  // Filter by Search Query
  const filteredEntries = rankedEntries.filter((entry) =>
    entry.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserRank = rankedEntries.find((e) => e.id === user?.id);

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentStyle={styles.container}
    >
      <Text style={styles.headerTitle}>Leaderboard</Text>

      {/* Tabs Switcher */}
      <View style={styles.filterSection}>
        {/* Scope Selector */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, scope === "global" && styles.activeTab]}
            onPress={() => setScope("global")}
          >
            <Text style={[styles.tabText, scope === "global" && styles.activeTabText]}>Global</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, scope === "local" && styles.activeTab]}
            onPress={() => setScope("local")}
            disabled={!user}
          >
            <Text style={[styles.tabText, scope === "local" && styles.activeTabText]}>
              Local ({user?.homeCity || "City"})
            </Text>
          </Pressable>
        </View>

        {/* Metric Selector */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, metric === "distance" && styles.activeTab]}
            onPress={() => setMetric("distance")}
          >
            <Text style={[styles.tabText, metric === "distance" && styles.activeTabText]}>Distance</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, metric === "cells" && styles.activeTab]}
            onPress={() => setMetric("cells")}
          >
            <Text style={[styles.tabText, metric === "cells" && styles.activeTabText]}>Sectors</Text>
          </Pressable>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={colors.mutedText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search runners..."
          placeholderTextColor={colors.mutedText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={16} color={colors.mutedText} />
          </Pressable>
        )}
      </View>

      {/* Standings List */}
      <View style={styles.list}>
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => {
            const isSelf = entry.id === user?.id;
            return (
              <View key={entry.id} style={isSelf ? styles.selfRowContainer : null}>
                <LeaderboardRow entry={entry} />
                {isSelf && <Text style={styles.selfLabel}>YOU</Text>}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={32} color={colors.mutedText} />
            <Text style={styles.emptyText}>No runners found matching "{searchQuery}"</Text>
          </View>
        )}
      </View>

      {/* Pinned User Footer (if not visible or search active) */}
      {user && currentUserRank && !searchQuery && (
        <View style={styles.pinnedFooter}>
          <Text style={styles.pinnedTitle}>YOUR CURRENT STANDING</Text>
          <LeaderboardRow entry={currentUserRank} />
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 160,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.xs,
    fontFamily: "Poppins",
  },
  filterSection: {
    gap: spacing.sm,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radii.sm,
  },
  activeTab: {
    backgroundColor: colors.border,
  },
  tabText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  activeTabText: {
    color: colors.text,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
  },
  list: {
    gap: spacing.md,
  },
  selfRowContainer: {
    position: "relative",
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  selfLabel: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.success,
    color: colors.surface,
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: "600",
  },
  pinnedFooter: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  pinnedTitle: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
