import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { colors, spacing } from "@/theme";

type AppScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function AppScreen({
  children,
  contentStyle,
  scrollable = true,
  refreshing = false,
  onRefresh,
}: AppScreenProps) {
  if (!scrollable) {
    return <View style={[styles.staticContainer, contentStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  staticContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: 104,
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: 112,
    gap: spacing.lg,
  },
});
