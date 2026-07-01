import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "@/theme";

type MetricCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

export function MetricCard({ accent = false, label, value }: MetricCardProps) {
  return (
    <View style={[styles.container, accent && styles.accent]}>
      <Text selectable style={styles.value}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 120,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  accent: {
    borderColor: colors.accent,
  },
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  label: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
});
