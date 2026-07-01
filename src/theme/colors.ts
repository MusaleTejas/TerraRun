export const colors = {
  background: "#0F0F10",
  surface: "#161617",
  primary: "#FF8A00",
  secondary: "#3AC9FA",
  accent: "#6352CA",
  text: "#FFFFFF",
  mutedText: "#8E8E93",
  border: "#2C2C2E",
  success: "#69D09A",
  warning: "#F2B84B",
  danger: "#FF6B6B",
  overlay: "rgba(15, 15, 16, 0.74)",
} as const;

export type TerraRunColor = keyof typeof colors;
