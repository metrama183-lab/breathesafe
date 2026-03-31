import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import useStore from "../../src/store/useStore";
import { COLORS, SPACING, FONT } from "../../src/constants/theme";

const POPULAR_CITIES = [
  { city: "Milano", country: "IT" },
  { city: "Roma", country: "IT" },
  { city: "Torino", country: "IT" },
  { city: "Napoli", country: "IT" },
  { city: "London", country: "GB" },
  { city: "Paris", country: "FR" },
  { city: "Berlin", country: "DE" },
  { city: "Madrid", country: "ES" },
  { city: "Amsterdam", country: "NL" },
  { city: "Stockholm", country: "SE" },
  { city: "Warszawa", country: "PL" },
  { city: "Praha", country: "CZ" },
];

export default function OnboardingScreen() {
  const setCity = useStore((s) => s.setCity);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const enableHealthConnect = useStore((s) => s.enableHealthConnect);
  const healthConnectAvailable = useStore((s) => s.healthConnectAvailable);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");

  const filteredCities = search.length > 0
    ? POPULAR_CITIES.filter((c) =>
        c.city.toLowerCase().includes(search.toLowerCase())
      )
    : POPULAR_CITIES;

  const handleCitySelect = (city: string, country: string) => {
    setCity(city, country);
    setStep(1);
  };

  const handleFinish = () => {
    setOnboarded();
    router.replace("/(tabs)");
  };

  const handleEnableHC = async () => {
    await enableHealthConnect();
    handleFinish();
  };

  if (step === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🫁</Text>
        <Text style={styles.title}>BreatheSafe</Text>
        <Text style={styles.tagline}>
          Know what you're really breathing.{"\n"}
          Your personal air pollution dose tracker.
        </Text>

        <Text style={styles.question}>Where do you live?</Text>

        <TextInput
          style={styles.input}
          placeholder="Search city..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.cityGrid}>
          {filteredCities.map((c) => (
            <TouchableOpacity
              key={c.city}
              style={styles.cityChip}
              onPress={() => handleCitySelect(c.city, c.country)}
            >
              <Text style={styles.cityChipText}>{c.city}</Text>
              <Text style={styles.cityChipCountry}>{c.country}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, styles.content, { justifyContent: "center" }]}>
      {healthConnectAvailable ? (
        <>
          <Text style={styles.emoji}>⌚</Text>
          <Text style={styles.title}>Health Connect</Text>
          <Text style={styles.tagline}>
            Connect to Google Health Connect to automatically track your
            activities (walking, cycling, running, sleep).{"\n\n"}
            Only cooking and transport need manual input.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleEnableHC}>
            <Text style={styles.primaryBtnText}>Enable Health Connect</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleFinish}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.tagline}>
            Use the Day tab to log your activities, or apply a quick template.
            {"\n\n"}Your dose is calculated instantly using real air quality data
            and peer-reviewed science.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
            <Text style={styles.primaryBtnText}>Start Tracking</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingTop: 80, paddingBottom: 40 },
  emoji: { fontSize: 64, textAlign: "center", marginBottom: SPACING.md },
  title: {
    color: COLORS.text,
    fontSize: 32,
    ...FONT.bold,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  question: {
    color: COLORS.text,
    fontSize: 20,
    ...FONT.semibold,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  cityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  cityChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  cityChipText: { color: COLORS.text, fontSize: 15, ...FONT.medium },
  cityChipCountry: { color: COLORS.textMuted, fontSize: 12 },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    padding: SPACING.md + 2,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  primaryBtnText: { color: COLORS.bg, fontSize: 17, ...FONT.bold },
  skipBtn: {
    padding: SPACING.md,
    alignItems: "center",
  },
  skipBtnText: { color: COLORS.textMuted, fontSize: 15 },
});
