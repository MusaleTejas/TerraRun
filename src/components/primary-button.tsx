import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { GestureResponderEvent, StyleProp, ViewStyle } from "react-native";

import { colors, radii, spacing } from "@/theme";

type PrimaryButtonProps = PropsWithChildren<{
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  variant?: "primary" | "secondary" | "ghost";
}>;

export function PrimaryButton({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
  style,
  variant = "primary",
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, variant === "ghost" && styles.ghostLabel]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  ghostLabel: {
    color: colors.accent,
  },
});
