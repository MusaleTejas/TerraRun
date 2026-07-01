import React, { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen, PrimaryButton, SectionCard, StatusPill } from "@/components";
import { firebaseServices, signUpRunner, signInRunner, checkUserExists, sendVerificationEmail } from "@/lib/firebase";
import { useSessionStore } from "@/store/session-store";
import { colors, spacing, typography, radii } from "@/theme";

export function LoginScreen() {
  const { signInWithDemoAccount, signInWithUser } = useSessionStore();
  
  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeCity, setHomeCity] = useState("");
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Multi-step verification states (OTP is only for creating an account)
  const [authState, setAuthState] = useState<"input" | "verification">("input");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  function handleDemoSignIn() {
    signInWithDemoAccount();
    router.replace("/map");
  }

  // Generate 6-digit OTP code for registration
  function triggerOtpCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setVerificationCode(""); // reset input
    return code;
  }

  // Handle Form Submission
  async function handleAuthSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all email and password fields.");
      return;
    }

    if (isRegistering && (!displayName.trim() || !homeCity.trim())) {
      Alert.alert("Error", "Please specify your runner name and home city to register.");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        // Step 1: Query Firestore to see if this email is already registered
        const exists = await checkUserExists(email.trim());
        if (exists) {
          Alert.alert(
            "User Already Exists",
            "A runner is already registered with this email address. Please switch to Sign In instead."
          );
          setLoading(false);
          return;
        }

        // Step 2: Proceed with OTP Verification check
        const code = triggerOtpCode();
        setAuthState("verification");
        
        // Dispatch actual verification email in the background via Resend
        sendVerificationEmail(email.trim(), code).catch((err) =>
          console.error("Failed to deliver verification code to inbox:", err)
        );

        Alert.alert(
          "Registration Verification",
          `A 6-digit verification code was sent to ${email}.\n\nDemo Verification Code: ${code}`
        );
      } else {
        // Sign In Flow: Direct Sign In without OTP code!
        const user = await signInRunner(email.trim(), password.trim());
        signInWithUser(user);
        
        Alert.alert("Success", "Signed in successfully!");
        router.replace("/map");
      }
    } catch (error: any) {
      console.error("Authentication check failed:", error);
      Alert.alert(
        "Authentication Failed",
        `Code: ${error.code || "unknown"}\n\nMessage: ${error.message || "Invalid credentials."}`
      );
    } finally {
      setLoading(false);
    }
  }

  // Handle Registration OTP Verification
  async function handleVerifyOtp() {
    if (verificationCode.trim() !== generatedOtp) {
      Alert.alert("Verification Error", "The code you entered is invalid. Please check and try again.");
      return;
    }

    setLoading(true);
    try {
      // User verified registration OTP code! Now create Firebase Auth account & Firestore document
      await signUpRunner(
        email.trim(),
        password.trim(),
        displayName.trim(),
        homeCity.trim()
      );
      
      // Auto-sign in the newly created account
      const user = await signInRunner(email.trim(), password.trim());
      signInWithUser(user);
      
      Alert.alert("Success", "Account created successfully and email verified!");
      router.replace("/map");
    } catch (error: any) {
      console.error("Verification registration error:", error);
      if (error.code === "auth/email-already-in-use" || error.message?.includes("email-already-in-use")) {
        Alert.alert(
          "Email Already in Use",
          "This email address is already registered in Firebase. Please go back and Sign In, or use a different email to register."
        );
      } else {
        Alert.alert(
          "Verification Failed",
          `Code: ${error.code || "unknown"}\n\nMessage: ${error.message || "An unexpected error occurred."}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // OTP Verification Screen render (Only shown for creating accounts)
  if (authState === "verification") {
    return (
      <AppScreen contentStyle={styles.content}>
        <View style={styles.hero}>
          <StatusPill label="Verification required" tone="warning" />
          <Text style={styles.logo}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit security code sent to {email} to authorize your runner registration.
          </Text>
        </View>

        <SectionCard style={styles.authCard}>
          <Text style={styles.cardTitle}>Confirmation Code</Text>
          <Text style={styles.otpHelper}>Demo Code: <Text style={styles.boldText}>{generatedOtp}</Text></Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
              <TextInput
                style={styles.otpInput}
                placeholder="0 0 0 0 0 0"
                placeholderTextColor={colors.mutedText}
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
                autoFocus={true} // Autofocus OTP entry upon screen load
              />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <PrimaryButton
              accessibilityLabel="Verify code and continue"
              onPress={handleVerifyOtp}
              style={styles.submitBtn}
            >
              Verify & Continue
            </PrimaryButton>
          )}

          <Pressable 
            onPress={() => setAuthState("input")} 
            style={styles.switchMode}
            disabled={loading}
          >
            <Text style={styles.switchText}>Back</Text>
          </Pressable>
        </SectionCard>

        <View style={styles.actions}>
          <Text style={styles.legal}>Check alerts or console logs for the verification key.</Text>
        </View>
      </AppScreen>
    );
  }

  // Normal Form Screen renderer
  return (
    <AppScreen contentStyle={styles.content}>
      <View style={styles.hero}>
        <StatusPill label="Territory running" tone="primary" />
        <Text selectable style={styles.logo}>
          Run Yatra
        </Text>
        <Text style={styles.tagline}>
          Run. Capture. Conquer.
        </Text>
        <Text style={styles.subtitle}>
          Turn every run into captured ground, live routes, and city-wide rankings.
        </Text>
      </View>

      {/* Main Auth Form */}
      <SectionCard style={styles.authCard}>
        <Text style={styles.cardTitle}>
          {isRegistering ? "Create Runner Account" : "Runner Sign In"}
        </Text>

        {isRegistering && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Alex Rivera"
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoFocus={isRegistering} // Focus display name immediately if registering
                  autoComplete="name"
                  textContentType="name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Home City</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="map-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="San Francisco"
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={homeCity}
                  onChangeText={setHomeCity}
                  autoComplete="street-address"
                  textContentType="addressCity"
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="runner@terrarun.com"
              placeholderTextColor={colors.mutedText}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              autoFocus={!isRegistering} // Focus email immediately if logging in
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedText}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              textContentType="password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedText} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <PrimaryButton
            accessibilityLabel={isRegistering ? "Register account" : "Sign in to account"}
            onPress={handleAuthSubmit}
            style={styles.submitBtn}
          >
            {isRegistering ? "Register & Verify" : "Sign In"}
          </PrimaryButton>
        )}

        <Pressable 
          onPress={() => setIsRegistering(!isRegistering)} 
          style={styles.switchMode}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            {isRegistering ? "Already have an account? Sign In" : "New runner? Create an account"}
          </Text>
        </Pressable>
      </SectionCard>

      {/* Firebase Status Badge */}
      <SectionCard style={styles.firebaseCard}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={firebaseServices.isConfigured ? "cloud-done" : "cloud-offline"}
            size={16}
            color={firebaseServices.isConfigured ? colors.success : colors.warning}
          />
          <Text style={styles.firebaseTitle}>Firebase credentials status</Text>
        </View>
        <Text selectable style={styles.bodyText}>
          {firebaseServices.isConfigured
            ? "Production Firebase connection is active and environment variables loaded."
            : "Firebase is in offline mode. Supply EXPO_PUBLIC_FIREBASE_* values to bind cloud database."}
        </Text>
      </SectionCard>

      <View style={styles.actions}>
        <PrimaryButton
          accessibilityLabel="Sign in with demo account"
          onPress={handleDemoSignIn}
          variant="secondary"
          style={styles.demoBtn}
        >
          Continue with demo
        </PrimaryButton>
        <Text style={styles.legal}>Production auth hooks are isolated in src/lib/firebase.ts.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  logo: {
    color: colors.text,
    ...typography.hero,
  },
  tagline: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: -4,
  },
  subtitle: {
    color: colors.mutedText,
    ...typography.body,
    lineHeight: 22,
  },
  authCard: {
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: spacing.xl,
  },
  cardTitle: {
    color: colors.text,
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  inputGroup: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  otpInput: {
    flex: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center",
  },
  otpHelper: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  boldText: {
    color: colors.primary,
    fontWeight: "900",
  },
  eyeIcon: {
    padding: 4,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  switchMode: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  switchText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  firebaseCard: {
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  firebaseTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  bodyText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  actions: {
    gap: spacing.md,
  },
  demoBtn: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  legal: {
    color: colors.mutedText,
    textAlign: "center",
    ...typography.caption,
  },
  loader: {
    marginVertical: spacing.md,
  },
});
