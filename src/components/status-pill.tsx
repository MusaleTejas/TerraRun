import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "@/theme";

type StatusPillProps = {
  label: string;
  tone?: "accent" | "primary" | "success" | "warning";
};

const toneColors = {
  accent: colors.accent,
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
} as const;

export function StatusPill({ label, tone = "accent" }: StatusPillProps) {
  return (
    <View style={[styles.container, { borderColor: toneColors[tone] }]}>
      <View style={[styles.dot, { backgroundColor: toneColors[tone] }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
});
