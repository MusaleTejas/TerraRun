import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Switch, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen, PrimaryButton, SectionCard } from "@/components";
import { useSessionStore } from "@/store/session-store";
import { useRunStore } from "@/store/run-store";
import { colors, spacing, typography, radii } from "@/theme";
import { formatDistance, formatDuration, formatPace } from "@/utils";

import { ProfileSummary } from "../components/profile-summary";

export function ProfileScreen() {
  const { signOut, user, updateProfile } = useSessionStore();
  const { completedRuns } = useRunStore();

  // Sub-panel routing: "none" | "territory" | "statistics" | "settings"
  const [activeSubPanel, setActiveSubPanel] = useState<"none" | "territory" | "statistics" | "settings">("none");

  // Profile Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || "");
  const [editCity, setEditCity] = useState(user?.homeCity || "");
  const [editGender, setEditGender] = useState(user?.gender || "Male");
  const [editDob, setEditDob] = useState(user?.dob || "1998-05-12");
  const [editAge, setEditAge] = useState(String(user?.age || 28));
  const [editAddress, setEditAddress] = useState(user?.address || "");
  const [editPhoneNumber, setEditPhoneNumber] = useState(user?.phoneNumber || "");
  const [editYatraColor, setEditYatraColor] = useState(user?.yatraColor || "#FF8A00");

  // RGB Sliders for Custom color scale picker
  const [rVal, setRVal] = useState(255);
  const [gVal, setGVal] = useState(138);
  const [bVal, setBVal] = useState(0);

  // Sync RGB sliders when editYatraColor changes
  useEffect(() => {
    if (editYatraColor.startsWith("#") && editYatraColor.length === 7) {
      const r = parseInt(editYatraColor.substring(1, 3), 16);
      const g = parseInt(editYatraColor.substring(3, 5), 16);
      const b = parseInt(editYatraColor.substring(5, 7), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        setRVal(r);
        setGVal(g);
        setBVal(b);
      }
    }
  }, [editYatraColor]);

  // Convert RGB values back to Hex code
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => {
      const hex = Math.round(c).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  // Push Notifications state switches
  const [notifs, setNotifs] = useState({
    heartedActivity: true,
    heartedStatus: true,
    commentActivity: true,
    commentStatus: true,
    replyComment: true,
    following: true,
    followRequest: true,
    supportQuestion: true,
    dailyReflection: true,
    upcomingActivity: true,
    privateLobby: true,
    clubInvite: true,
    stolenSingle: true,
    stolenPrivate: true,
    referralUsed: true,
    marketing: false,
  });

  // Theft Notifications Threshold selection: "5" | "20" | "100"
  const [threshold, setThreshold] = useState<"5" | "20" | "100">("20");

  const toggleSwitch = (key: keyof typeof notifs) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  function handleSaveProfile() {
    if (editName.trim() && editCity.trim()) {
      updateProfile({
        displayName: editName.trim(),
        homeCity: editCity.trim(),
        gender: editGender,
        dob: editDob,
        age: parseInt(editAge) || 0,
        address: editAddress,
        phoneNumber: editPhoneNumber,
        yatraColor: editYatraColor,
      });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } else {
      Alert.alert("Error", "Name and Home City cannot be blank.");
    }
  }

  function handleCancelEdit() {
    setEditName(user?.displayName || "");
    setEditCity(user?.homeCity || "");
    setEditGender(user?.gender || "Male");
    setEditDob(user?.dob || "");
    setEditAge(String(user?.age || 0));
    setEditAddress(user?.address || "");
    setEditPhoneNumber(user?.phoneNumber || "");
    setEditYatraColor(user?.yatraColor || "#FF8A00");
    setIsEditing(false);
  }

  // --- SUB PANEL RENDERERS ---

  // 1. My Territory Sub Panel
  if (activeSubPanel === "territory") {
    return (
      <AppScreen contentStyle={styles.container}>
        <View style={styles.subHeader}>
          <Pressable onPress={() => setActiveSubPanel("none")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.subTitle}>My Territory</Text>
        </View>

        <SectionCard style={styles.statsCard}>
          <Text style={styles.cardTitle}>Territory Coverage</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridStat}>
              <Text style={styles.gridStatVal}>{completedRuns.length}</Text>
              <Text style={styles.gridStatLbl}>Total Runs</Text>
            </View>
            <View style={styles.gridStat}>
              <Text style={styles.gridStatVal}>{user?.territoryCount || 0}</Text>
              <Text style={styles.gridStatLbl}>Captured Places</Text>
            </View>
          </View>
        </SectionCard>

        <Text style={styles.sectionHeader}>Captured Sectors (S2 / H3 Grid)</Text>
        <ScrollView style={styles.scroller}>
          {completedRuns.length > 0 ? (
            completedRuns.flatMap((run, index) =>
              run.capturedCells.map((cell, cIdx) => (
                <SectionCard key={`${run.id}-${cIdx}`} style={styles.sectorCard}>
                  <View style={styles.sectorRow}>
                    <Ionicons name="map" size={20} color={user?.yatraColor || colors.primary} />
                    <View style={styles.sectorText}>
                      <Text style={styles.sectorName} numberOfLines={1}>
                        Sector #{cell.h3Index}
                      </Text>
                      <Text style={styles.sectorTime}>
                        Captured during Run #{completedRuns.length - index}
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              ))
            )
          ) : (
            <View style={styles.emptyRuns}>
              <Ionicons name="location-outline" size={32} color={colors.mutedText} />
              <Text style={styles.emptyRunsText}>No captured territory sectors found.</Text>
            </View>
          )}
        </ScrollView>
      </AppScreen>
    );
  }

  // 2. Statistics Sub Panel
  if (activeSubPanel === "statistics") {
    const totalDistanceKm = ((user?.totalDistanceMeters || 0) / 1000).toFixed(1);
    const estKcal = Math.round((user?.totalDistanceMeters || 0) * 0.065); // 65 kcal per km approx

    return (
      <AppScreen contentStyle={styles.container}>
        <View style={styles.subHeader}>
          <Pressable onPress={() => setActiveSubPanel("none")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.subTitle}>Statistics</Text>
        </View>

        <SectionCard style={styles.statsCard}>
          <Text style={styles.cardTitle}>Lifetime Run Statistics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{totalDistanceKm} km</Text>
              <Text style={styles.metricLbl}>Total Distance</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{user?.totalRuns || 0}</Text>
              <Text style={styles.metricLbl}>Runs Count</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{estKcal} kcal</Text>
              <Text style={styles.metricLbl}>Calories Burned</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>#{user?.rank || 99}</Text>
              <Text style={styles.metricLbl}>Global Rank</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard style={styles.statsCard}>
          <Text style={styles.cardTitle}>Level Progress</Text>
          <View style={styles.levelProgressRow}>
            <Text style={styles.levelTitle}>Level {user?.level || 1}</Text>
            <Text style={styles.levelXp}>
              {(user?.xp || 0).toLocaleString()} / 20,000 XP
            </Text>
          </View>
          <View style={styles.progressRail}>
            <View 
              style={[
                styles.progressActiveFill, 
                { 
                  width: `${Math.min(Math.max(((user?.xp || 0) / 20000) * 100, 0), 100)}%`,
                  backgroundColor: user?.yatraColor || colors.primary 
                }
              ]} 
            />
          </View>
        </SectionCard>
      </AppScreen>
    );
  }

  // 3. Settings (Push Notifications) Sub Panel
  if (activeSubPanel === "settings") {
    return (
      <AppScreen contentStyle={styles.container}>
        <View style={styles.subHeader}>
          <Pressable onPress={() => setActiveSubPanel("none")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.subTitle}>Settings</Text>
        </View>

        <ScrollView style={styles.settingsScroll} contentContainerStyle={styles.settingsScrollContent}>
          <Text style={styles.groupHeader}>Push Notifications</Text>

          {[
            { key: "heartedActivity", label: "Hearted activity", sub: "Get a notification when someone hearts your activity" },
            { key: "heartedStatus", label: "Hearted status", sub: "Get a notification when someone hearts your status" },
            { key: "commentActivity", label: "Comment on your activity", sub: "Get a notification when someone comments on your activity" },
            { key: "commentStatus", label: "Comment on your status", sub: "Get a notification when someone comments on your status" },
            { key: "replyComment", label: "Replied to your comment", sub: "Get a notification when someone replies to your comment" },
            { key: "following", label: "Following you", sub: "Get a notification when someone follows you" },
            { key: "followRequest", label: "Follow request", sub: "Get a notification when someone sends you a follow request" },
            { key: "supportQuestion", label: "Question answered", sub: "Get a notification when INTVL answers your support question" },
            { key: "dailyReflection", label: "Daily reflection reminder", sub: "Get a notification reminder for your daily reflections" },
            { key: "upcomingActivity", label: "Upcoming activity reminder", sub: "Get a notification on the morning of your scheduled activity" },
            { key: "privateLobby", label: "Private lobby invite", sub: "Get a notification when someone invites you to a private lobby" },
            { key: "clubInvite", label: "Club invite", sub: "Get a notification when someone invites you to a Run Yatra club" },
            { key: "stolenSingle", label: "Territory stolen Single player", sub: "Get a notification when your territory is stolen in single player mode" },
            { key: "stolenPrivate", label: "Territory stolen Private lobby", sub: "Get a notification when your territory is stolen in a private lobby" },
            { key: "referralUsed", label: "Referral code used", sub: "Get a notification when someone uses your referral code" },
            { key: "marketing", label: "Marketing announcements", sub: "Get notified about new competitions, skins, and feature launches" },
          ].map((item) => (
            <View key={item.key} style={styles.notifRow}>
              <View style={styles.notifTextContainer}>
                <Text style={styles.notifLabel}>{item.label}</Text>
                <Text style={styles.notifSub}>{item.sub}</Text>
              </View>
              <Switch
                value={notifs[item.key as keyof typeof notifs]}
                onValueChange={() => toggleSwitch(item.key as keyof typeof notifs)}
                trackColor={{ false: colors.border, true: user?.yatraColor || colors.primary }}
                thumbColor={colors.text}
              />
            </View>
          ))}

          <Text style={styles.groupHeader}>Territory Capture Thresholds</Text>
          <Text style={styles.thresholdDesc}>Adjust the thresholds for notifications for territory captures:</Text>

          {[
            { val: "5", label: "5% or less gets taken" },
            { val: "20", label: "5% to 20% gets taken" },
            { val: "100", label: "20% to 100% gets taken" },
          ].map((item) => (
            <Pressable
              key={item.val}
              style={styles.radioRow}
              onPress={() => setThreshold(item.val as any)}
            >
              <View style={styles.radioButton}>
                {threshold === item.val && (
                  <View style={[styles.radioButtonActive, { backgroundColor: user?.yatraColor || colors.primary }]} />
                )}
              </View>
              <Text style={styles.radioLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </AppScreen>
    );
  }

  // --- MAIN SCREEN RENDERING ---

  return (
    <AppScreen contentStyle={styles.container}>
      <Text style={styles.profileHeaderTitle}>Profile</Text>

      {user ? (
        <>
          <ProfileSummary user={user} />

          {/* Edit Profile Form Settings Panel */}
          {isEditing ? (
            <SectionCard style={styles.editCard}>
              <Text style={styles.cardTitle}>Edit Profile Settings</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Runner Name"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Home City</Text>
                <TextInput
                  style={styles.input}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="Home City"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                  {["Male", "Female", "Other"].map((g) => (
                    <Pressable
                      key={g}
                      style={[
                        styles.genderBtn,
                        editGender === g && [styles.genderBtnActive, { borderColor: editYatraColor }],
                      ]}
                      onPress={() => setEditGender(g)}
                    >
                      <Text style={[styles.genderText, editGender === g && { color: editYatraColor }]}>
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.label}>Date of Birth (DOB)</Text>
                  <TextInput
                    style={styles.input}
                    value={editDob}
                    onChangeText={setEditDob}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedText}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 0.8 }]}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={styles.input}
                    value={editAge}
                    onChangeText={setEditAge}
                    placeholder="Age"
                    placeholderTextColor={colors.mutedText}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editPhoneNumber}
                  onChangeText={setEditPhoneNumber}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, { height: 72 }]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Street Address, Appt, Zip Code"
                  placeholderTextColor={colors.mutedText}
                  multiline={true}
                />
              </View>

              {/* Yatra Custom Color Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Yatra Territory Color</Text>
                <View style={styles.colorPresetsRow}>
                  {[
                    { hex: "#FF8A00", label: "Orange" },
                    { hex: "#3AC9FA", label: "Blue" },
                    { hex: "#6352CA", label: "Purple" },
                    { hex: "#FF5E7E", label: "Pink" },
                    { hex: "#69D09A", label: "Green" },
                  ].map((preset) => (
                    <Pressable
                      key={preset.hex}
                      style={[
                        styles.colorPresetCircle,
                        { backgroundColor: preset.hex },
                        editYatraColor === preset.hex && styles.activePresetOutline,
                      ]}
                      onPress={() => setEditYatraColor(preset.hex)}
                    />
                  ))}
                </View>

                {/* Custom RGB scale sliders */}
                <Text style={styles.rgbHeader}>RGB Color Scale Selector</Text>
                
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Red: {rVal}</Text>
                  <TextInput
                    style={styles.numInput}
                    value={String(rVal)}
                    onChangeText={(val) => {
                      const num = Math.min(Math.max(parseInt(val) || 0, 0), 255);
                      setRVal(num);
                      setEditYatraColor(rgbToHex(num, gVal, bVal));
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>

                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Green: {gVal}</Text>
                  <TextInput
                    style={styles.numInput}
                    value={String(gVal)}
                    onChangeText={(val) => {
                      const num = Math.min(Math.max(parseInt(val) || 0, 0), 255);
                      setGVal(num);
                      setEditYatraColor(rgbToHex(rVal, num, bVal));
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>

                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Blue: {bVal}</Text>
                  <TextInput
                    style={styles.numInput}
                    value={String(bVal)}
                    onChangeText={(val) => {
                      const num = Math.min(Math.max(parseInt(val) || 0, 0), 255);
                      setBVal(num);
                      setEditYatraColor(rgbToHex(rVal, gVal, num));
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>

                {/* Color Preview box */}
                <View style={styles.previewContainer}>
                  <View style={[styles.colorPreview, { backgroundColor: editYatraColor }]} />
                  <Text style={styles.previewText}>Active Selection: {editYatraColor}</Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.smallButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.smallButton, styles.saveButton, { backgroundColor: editYatraColor }]}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              </View>
            </SectionCard>
          ) : (
            <PrimaryButton
              accessibilityLabel="Edit profile details"
              onPress={() => setIsEditing(true)}
              variant="secondary"
              style={{ borderColor: user.yatraColor || colors.primary }}
            >
              Edit Profile
            </PrimaryButton>
          )}

          {/* Achievements Grid Section Overlay */}
          <View style={styles.achievementsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Achievements</Text>
              <Pressable>
                <Text style={[styles.viewAllText, { color: user.yatraColor || colors.primary }]}>
                  View all
                </Text>
              </Pressable>
            </View>
            <View style={styles.badgesRow}>
              <View style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: "rgba(255, 138, 0, 0.12)" }]}>
                  <Ionicons name="walk" size={20} color={colors.primary} />
                </View>
                <Text style={styles.badgeLabel}>First Run</Text>
              </View>
              <View style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: "rgba(58, 201, 250, 0.12)" }]}>
                  <Ionicons name="compass" size={20} color={colors.secondary} />
                </View>
                <Text style={styles.badgeLabel}>Explorer</Text>
              </View>
              <View style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: "rgba(99, 82, 202, 0.12)" }]}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
                </View>
                <Text style={styles.badgeLabel}>Defender</Text>
              </View>
              <View style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: "rgba(255, 138, 0, 0.12)" }]}>
                  <Ionicons name="ribbon" size={20} color={colors.primary} />
                </View>
                <Text style={styles.badgeLabel}>Conqueror</Text>
              </View>
              <View style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: "rgba(105, 208, 154, 0.12)" }]}>
                  <Ionicons name="flame" size={20} color={colors.success} />
                </View>
                <Text style={styles.badgeLabel}>Streak</Text>
              </View>
            </View>
          </View>

          {/* Menu Options Section */}
          <View style={styles.menuSection}>
            <Pressable style={styles.menuItem} onPress={() => setActiveSubPanel("territory")}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="map-outline" size={18} color={colors.mutedText} />
                <Text style={styles.menuItemText}>My Territory</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => setActiveSubPanel("statistics")}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="bar-chart-outline" size={18} color={colors.mutedText} />
                <Text style={styles.menuItemText}>Statistics</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>

            <Pressable style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="people-outline" size={18} color={colors.mutedText} />
                <Text style={styles.menuItemText}>Friends</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => setActiveSubPanel("settings")}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="settings-outline" size={18} color={colors.mutedText} />
                <Text style={styles.menuItemText}>Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>
          </View>

          <PrimaryButton
            accessibilityLabel="Sign out"
            onPress={handleSignOut}
            variant="ghost"
            style={styles.signOutButton}
          >
            Sign out
          </PrimaryButton>
        </>
      ) : (
        <SectionCard>
          <Text style={styles.empty}>Sign in to sync your runner profile.</Text>
        </SectionCard>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 160,
    gap: spacing.md,
  },
  empty: {
    color: colors.mutedText,
    ...typography.body,
  },
  profileHeaderTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.xs,
    fontFamily: "Poppins",
  },
  editCard: {
    borderColor: colors.border,
    borderWidth: 1,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  inputGroup: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.md,
    fontSize: 14,
    fontWeight: "600",
  },
  genderRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  genderBtn: {
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  genderBtnActive: {
    borderWidth: 1.5,
  },
  genderText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "800",
  },
  colorPresetsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  colorPresetCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  activePresetOutline: {
    borderColor: colors.text,
    transform: [{ scale: 1.1 }],
  },
  rgbHeader: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sliderLabel: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  numInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    width: 56,
    height: 34,
    borderRadius: radii.sm,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  colorPreview: {
    width: 44,
    height: 34,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  smallButton: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelBtnText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: "700",
  },
  saveBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  statsCard: {
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  gridStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  gridStatVal: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900",
  },
  gridStatLbl: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metricItem: {
    width: "47%",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  metricVal: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  metricLbl: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  levelProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  levelTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  levelXp: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  progressRail: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressActiveFill: {
    height: "100%",
    borderRadius: 4,
  },
  scroller: {
    maxHeight: 400,
  },
  sectorCard: {
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sectorText: {
    flex: 1,
    gap: 2,
  },
  sectorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  sectorTime: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  emptyRuns: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyRunsText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
  settingsScroll: {
    maxHeight: 520,
  },
  settingsScrollContent: {
    paddingBottom: spacing.xl,
  },
  groupHeader: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  thresholdDesc: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  notifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifTextContainer: {
    flex: 0.82,
    gap: 2,
  },
  notifLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  notifSub: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  achievementsSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeader: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badgeItem: {
    alignItems: "center",
    flex: 1,
  },
  badgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  badgeLabel: {
    color: colors.mutedText,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 6,
    textAlign: "center",
  },
  menuSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuItemText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  signOutButton: {
    marginTop: spacing.lg,
  },
});
