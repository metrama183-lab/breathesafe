import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import useStore from "../src/store/useStore";
import { COLORS } from "../src/constants/theme";

export default function RootLayout() {
  const loadPersistedData = useStore((s) => s.loadPersistedData);
  const isLoading = useStore((s) => s.isLoading);
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadPersistedData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!hasOnboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (hasOnboarded && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [isLoading, hasOnboarded, segments]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg },
          animation: "fade",
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
});
