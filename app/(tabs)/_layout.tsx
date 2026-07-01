import { Tabs } from "expo-router/js-tabs";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii } from "@/theme";

const tabIcons = {
  map: { active: "map", inactive: "map-outline" },
  run: { active: "play-circle", inactive: "play-circle-outline" },
  leaderboard: { active: "trophy", inactive: "trophy-outline" },
  profile: { active: "person-circle", inactive: "person-circle-outline" },
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="map"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color, focused }) => {
          const icons = tabIcons[route.name as keyof typeof tabIcons];
          const iconName = focused ? icons.active : icons.inactive;

          return (
            <Ionicons
              name={iconName as any}
              size={24}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="map" options={{ title: "Map" }} />
      <Tabs.Screen name="run" options={{ title: "Run" }} />
      <Tabs.Screen name="leaderboard" options={{ title: "Leaderboard" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    height: 80,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
});

