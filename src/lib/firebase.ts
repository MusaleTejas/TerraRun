import { initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  type Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile as fbUpdateProfile, 
  signOut as fbSignOut,
  initializeAuth
} from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  getFirestore, 
  type Firestore, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

import { Platform } from "react-native";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

import type { TerraRunUser, RunSession } from "@/types";

export type FirebaseServices = {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  analytics: Analytics | null;
  isConfigured: boolean;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function hasFirebaseConfig(): boolean {
  return Object.values(firebaseConfig).every((value) => Boolean(value));
}

export function createFirebaseServices(): FirebaseServices {
  if (!hasFirebaseConfig()) {
    return {
      app: null,
      auth: null,
      db: null,
      analytics: null,
      isConfigured: false,
    };
  }

  try {
    const app = initializeApp(firebaseConfig);
    
    // Conditionally initialize analytics on web if supported
    let analytics: Analytics | null = null;
    if (Platform.OS === "web") {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {});
    }

    // Conditionally initialize Auth with persistence depending on platform
    let auth: Auth;
    if (Platform.OS === "web") {
      auth = getAuth(app);
    } else {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }

    return {
      app,
      auth,
      db: getFirestore(app),
      analytics,
      isConfigured: true,
    };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return {
      app: null,
      auth: null,
      db: null,
      analytics: null,
      isConfigured: false,
    };
  }
}

export const firebaseServices = createFirebaseServices();

// Generates a mock 6-digit OTP code for client side verification check
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if email already exists in Firestore users database
export async function checkUserExists(email: string): Promise<boolean> {
  if (!firebaseServices.isConfigured || !firebaseServices.db) {
    return false;
  }
  try {
    const q = query(
      collection(firebaseServices.db, "users"),
      where("email", "==", email.trim().toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.warn("Firestore checkUserExists lookup failed:", error);
    return false;
  }
}

// Sends a beautifully styled verification email using the Resend API
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY || "re_iw8XCEgT_4ZdDJyeZU2HmtVgNcTNa8vcz";
  if (!apiKey) {
    console.warn("Resend API key missing. Could not send actual email.");
    return false;
  }

  const htmlContent = `
    <div style="background-color: #1A0D0A; padding: 40px; font-family: sans-serif; color: #FFFFFF; text-align: center;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #241613; border: 1px solid #DC8E47; border-radius: 12px; padding: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
        <h1 style="color: #DC8E47; font-size: 28px; margin-bottom: 10px; font-weight: 800;">TerraRun</h1>
        <p style="color: #CCCCCC; font-size: 16px; line-height: 24px; margin-bottom: 25px;">
          Welcome to the grid. Verify your email to activate your runner profile, claim territory, and compete on the leaderboard.
        </p>
        <div style="background-color: #1A0D0A; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #3AC9FA; font-weight: bold; display: block; margin-bottom: 10px;">Verification Code</span>
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #DC8E47;">${code}</span>
        </div>
        <p style="color: #888888; font-size: 12px;">
          This code will expire shortly. If you did not request this, please ignore this email.
        </p>
        <div style="margin-top: 30px; border-top: 1px solid #33221E; padding-top: 20px;">
          <p style="color: #555555; font-size: 12px; margin: 0;">&copy; 2026 TerraRun. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "TerraRun <onboarding@resend.dev>",
        to: [email.trim().toLowerCase()],
        subject: "Verify your TerraRun Account",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Resend API response warning:", errText);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Failed to send verification email via Resend (CORS or network restriction):", error);
    return false;
  }
}

// User sign-up flow connecting to actual Firebase Auth + Firestore profiles
export async function signUpRunner(
  email: string,
  password: string,
  displayName: string,
  homeCity: string
): Promise<{ uid: string; otpCode: string }> {
  const otpCode = generateOtpCode();
  
  if (!firebaseServices.isConfigured || !firebaseServices.auth || !firebaseServices.db) {
    console.warn("Firebase not configured. Simulating Sign Up in offline mode.");
    // In mock mode, we generate a fake user UID
    return { uid: "mock-uid-" + Date.now(), otpCode };
  }

  // Actual Firebase Authentication calls
  const userCredential = await createUserWithEmailAndPassword(
    firebaseServices.auth,
    email,
    password
  );
  const user = userCredential.user;

  // Set Auth display name
  await fbUpdateProfile(user, { displayName });

  // Create document in Firestore
  const userDocRef = doc(firebaseServices.db, "users", user.uid);
  const defaultUserData = {
    id: user.uid,
    displayName,
    email,
    homeCity,
    avatarUrl: "",
    totalDistanceMeters: 0,
    territoryCount: 0,
    rank: 99,
    level: 1,
    xp: 0,
    totalRuns: 0,
  };
  await setDoc(userDocRef, defaultUserData);

  return { uid: user.uid, otpCode };
}

// Helper to race promises against a timeout to prevent hanging on offline Firestore databases
function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Firestore operation timed out"));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// User sign-in flow fetching and returning detailed Firestore stats
export async function signInRunner(email: string, password: string): Promise<TerraRunUser & { level?: number; xp?: number; totalRuns?: number }> {
  if (!firebaseServices.isConfigured || !firebaseServices.auth || !firebaseServices.db) {
    console.warn("Firebase not configured. Simulating Sign In with mock credentials.");
    // Return standard demo account details
    return {
      id: "demo-runner",
      displayName: "Alex Rivera",
      email: email || "alex@terrarun.local",
      homeCity: "San Francisco",
      totalDistanceMeters: 128420,
      territoryCount: 482,
      rank: 12,
      level: 24,
      xp: 12450,
      totalRuns: 128,
    };
  }

  // Actual Firebase Auth call
  const userCredential = await signInWithEmailAndPassword(
    firebaseServices.auth,
    email,
    password
  );
  const user = userCredential.user;

  // Retrieve user document from Firestore with offline fallback handling & timeout
  const userDocRef = doc(firebaseServices.db, "users", user.uid);
  try {
    const docSnap = await timeoutPromise(getDoc(userDocRef), 2500);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: user.uid,
        displayName: data.displayName || user.displayName || "Runner",
        email: data.email || user.email || email,
        homeCity: data.homeCity || "San Francisco",
        totalDistanceMeters: data.totalDistanceMeters || 0,
        territoryCount: data.territoryCount || 0,
        rank: data.rank || 99,
        level: data.level || 1,
        xp: data.xp || 0,
        totalRuns: data.totalRuns || 0,
        gender: data.gender || "Not Specified",
        dob: data.dob || "",
        age: data.age || 0,
        address: data.address || "",
        phoneNumber: data.phoneNumber || "",
        yatraColor: data.yatraColor || "#FF8A00",
      };
    }
  } catch (error) {
    console.error("Firestore getDoc failed (offline mode?), using profile fallback:", error);
  }

  // Fallback if document doesn't exist or query fails due to offline state
  const defaultProfile = {
    id: user.uid,
    displayName: user.displayName || "Runner",
    email: user.email || email,
    homeCity: "San Francisco",
    totalDistanceMeters: 0,
    territoryCount: 0,
    rank: 99,
    level: 1,
    xp: 0,
    totalRuns: 0,
    gender: "Not Specified",
    dob: "",
    age: 0,
    address: "",
    phoneNumber: "",
    yatraColor: "#FF8A00",
  };

  try {
    await setDoc(userDocRef, defaultProfile);
  } catch (e) {
    console.warn("Could not save fallback profile to Firestore (client offline)", e);
  }

  return defaultProfile;
}

// User sign out flow
export async function signOutRunner(): Promise<void> {
  if (firebaseServices.isConfigured && firebaseServices.auth) {
    await fbSignOut(firebaseServices.auth);
  }
}

// Updates running profile document properties in Firestore
export async function updateFirebaseProfile(
  userId: string,
  updates: Partial<TerraRunUser>
): Promise<void> {
  if (firebaseServices.isConfigured && firebaseServices.db) {
    const userDocRef = doc(firebaseServices.db, "users", userId);
    await updateDoc(userDocRef, updates);
  }
}

// Saves a completed run session and increments running totals in Firestore
export async function saveFirebaseRun(
  userId: string,
  session: RunSession
): Promise<void> {
  if (firebaseServices.isConfigured && firebaseServices.db) {
    // Save run in sub-collection
    const runDocRef = doc(firebaseServices.db, "users", userId, "runs", session.id);
    await setDoc(runDocRef, session);

    // Fetch user document to read current stats
    const userDocRef = doc(firebaseServices.db, "users", userId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentDistance = data.totalDistanceMeters || 0;
      const currentCells = data.territoryCount || 0;
      const currentRuns = data.totalRuns || 0;
      const currentXp = data.xp || 0;
      const currentLevel = data.level || 1;

      // Increment values
      const newDistance = currentDistance + session.distanceMeters;
      const newCells = currentCells + session.capturedCells.length;
      const newRuns = currentRuns + 1;
      
      // Calculate XP added: 100 XP per km + 50 XP per cell captured
      const xpAdded = Math.round((session.distanceMeters / 1000) * 100 + session.capturedCells.length * 50);
      const tempXp = currentXp + xpAdded;

      // Standard Level formula: level multiplier of 20000 XP per level
      const xpPerLevel = 20000;
      const newLevel = currentLevel + Math.floor(tempXp / xpPerLevel);
      const newXp = tempXp % xpPerLevel;

      await updateDoc(userDocRef, {
        totalDistanceMeters: newDistance,
        territoryCount: newCells,
        totalRuns: newRuns,
        xp: newXp,
        level: newLevel,
      });
    }
  }
}
