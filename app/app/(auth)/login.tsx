import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.logo}>TerraRun</Text>

        <Text style={styles.subtitle}>
          Own every road you run.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/(tabs)/map")}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A0D0A",
    justifyContent: "space-between",
    padding: 30,
    paddingVertical: 80,
  },

  logo: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "800",
  },

  subtitle: {
    color: "#C9C9C9",
    marginTop: 12,
    fontSize: 18,
  },

  button: {
    backgroundColor: "#DC8E47",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
});