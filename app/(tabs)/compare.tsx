import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import useStore from "../../src/store/useStore";
import { COLORS, SPACING, FONT } from "../../src/constants/theme";
import { CIGARETTE_CONSTANT, WHO_PM25_LIMIT } from "../../src/constants/science";

interface CityData {
  city: string;
  pm25: number;
  cigarettesDay: number;
  cigarettesYear: number;
}

const C = CIGARETTE_CONSTANT;
const WORLD_CITIES: CityData[] = [
  { city: "Stockholm", pm25: 6, cigarettesDay: 6 / C, cigarettesYear: (6 / C) * 365 },
  { city: "Lisboa", pm25: 9, cigarettesDay: 9 / C, cigarettesYear: (9 / C) * 365 },
  { city: "Madrid", pm25: 10, cigarettesDay: 10 / C, cigarettesYear: (10 / C) * 365 },
  { city: "London", pm25: 11, cigarettesDay: 11 / C, cigarettesYear: (11 / C) * 365 },
  { city: "Amsterdam", pm25: 11, cigarettesDay: 11 / C, cigarettesYear: (11 / C) * 365 },
  { city: "Berlin", pm25: 12, cigarettesDay: 12 / C, cigarettesYear: (12 / C) * 365 },
  { city: "Tokyo", pm25: 12, cigarettesDay: 12 / C, cigarettesYear: (12 / C) * 365 },
  { city: "Paris", pm25: 14, cigarettesDay: 14 / C, cigarettesYear: (14 / C) * 365 },
  { city: "Roma", pm25: 16, cigarettesDay: 16 / C, cigarettesYear: (16 / C) * 365 },
  { city: "Praha", pm25: 17, cigarettesDay: 17 / C, cigarettesYear: (17 / C) * 365 },
  { city: "Budapest", pm25: 19, cigarettesDay: 19 / C, cigarettesYear: (19 / C) * 365 },
  { city: "Warszawa", pm25: 21, cigarettesDay: 21 / C, cigarettesYear: (21 / C) * 365 },
  { city: "Milano", pm25: 25, cigarettesDay: 25 / C, cigarettesYear: (25 / C) * 365 },
  { city: "Torino", pm25: 28, cigarettesDay: 28 / C, cigarettesYear: (28 / C) * 365 },
  { city: "Beijing", pm25: 42, cigarettesDay: 42 / C, cigarettesYear: (42 / C) * 365 },
  { city: "New Delhi", pm25: 99, cigarettesDay: 99 / C, cigarettesYear: (99 / C) * 365 },
].sort((a, b) => a.pm25 - b.pm25);

function CityRow({
  data,
  isUser,
  maxPm25,
}: {
  data: CityData;
  isUser: boolean;
  maxPm25: number;
}) {
  const barPct = (data.pm25 / maxPm25) * 100;
  const color =
    data.pm25 < 10
      ? COLORS.accent
      : data.pm25 < 20
      ? COLORS.warning
      : COLORS.danger;

  return (
    <View style={[rowStyles.row, isUser && rowStyles.rowHighlight]}>
      <View style={rowStyles.cityCol}>
        <Text style={[rowStyles.cityName, isUser && { color: COLORS.accent }]}>
          {isUser ? `📍 ${data.city}` : data.city}
        </Text>
      </View>
      <View style={rowStyles.barCol}>
        <View style={rowStyles.barBg}>
          <View
            style={[
              rowStyles.barFill,
              { width: `${Math.min(barPct, 100)}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
      <View style={rowStyles.valueCol}>
        <Text style={[rowStyles.value, { color }]}>
          {data.cigarettesDay.toFixed(1)}
        </Text>
        <Text style={rowStyles.unit}>🚬/d</Text>
      </View>
    </View>
  );
}

export default function CompareScreen() {
  const city = useStore((s) => s.city);
  const pm25 = useStore((s) => s.pm25);
  const todayResult = useStore((s) => s.todayResult);

  const userCigDay = todayResult?.cigarettes_equivalent ?? pm25 / CIGARETTE_CONSTANT;

  const maxPm25 = Math.max(...WORLD_CITIES.map((c) => c.pm25), pm25);

  const bestCity = WORLD_CITIES[0];
  const savedVsBest = useMemo(() => {
    const diff = (pm25 / CIGARETTE_CONSTANT - bestCity.pm25 / CIGARETTE_CONSTANT) * 365;
    return Math.round(diff);
  }, [pm25]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Compare</Text>
      <Text style={styles.subtitle}>Your city vs the world</Text>

      {/* Insight Card */}
      <View style={styles.insightCard}>
        <Text style={styles.insightText}>
          If you lived in{" "}
          <Text style={{ color: COLORS.accent, ...FONT.bold }}>
            {bestCity.city}
          </Text>{" "}
          instead of{" "}
          <Text style={{ color: COLORS.danger, ...FONT.bold }}>{city}</Text>,
          you'd breathe{" "}
          <Text style={{ color: COLORS.accent, ...FONT.bold }}>
            {savedVsBest} fewer cigarettes
          </Text>{" "}
          per year.
        </Text>
      </View>

      {/* Your Stats */}
      <View style={styles.yourStats}>
        <View style={styles.yourStatBlock}>
          <Text style={[styles.yourStatValue, { color: COLORS.cigarette }]}>
            {userCigDay.toFixed(1)}
          </Text>
          <Text style={styles.yourStatLabel}>🚬 per day</Text>
        </View>
        <View style={styles.yourStatBlock}>
          <Text style={[styles.yourStatValue, { color: COLORS.cigarette }]}>
            {Math.round(userCigDay * 365)}
          </Text>
          <Text style={styles.yourStatLabel}>🚬 per year</Text>
        </View>
        <View style={styles.yourStatBlock}>
          <Text style={[styles.yourStatValue, { color: COLORS.danger }]}>
            {(pm25 / WHO_PM25_LIMIT).toFixed(1)}x
          </Text>
          <Text style={styles.yourStatLabel}>WHO limit</Text>
        </View>
      </View>

      {/* City Rankings */}
      <View style={styles.rankCard}>
        <Text style={styles.rankTitle}>Global City Rankings</Text>
        <Text style={styles.rankSubtitle}>
          Annual average PM2.5 → daily cigarette equivalent
        </Text>

        {WORLD_CITIES.map((c) => (
          <CityRow
            key={c.city}
            data={c}
            isUser={c.city.toLowerCase() === city.toLowerCase()}
            maxPm25={maxPm25}
          />
        ))}
      </View>

      {/* WHO Context */}
      <View style={styles.whoContext}>
        <Text style={styles.whoContextTitle}>What does this mean?</Text>
        <Text style={styles.whoContextText}>
          The WHO recommends annual PM2.5 should not exceed {WHO_PM25_LIMIT} µg/m³.
          No city in this list meets that guideline. In 2025, only 14% of cities
          worldwide met the WHO standard (IQAir World Air Quality Report).
        </Text>
        <Text style={styles.whoContextText}>
          {"\n"}The cigarette equivalence is based on Berkeley Earth's formula: breathing
          air at {CIGARETTE_CONSTANT} µg/m³ PM2.5 for a year has the same statistical
          mortality risk as smoking 1 cigarette per day (Pope et al., 2016).
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingTop: 60, paddingBottom: 40 },
  title: { color: COLORS.text, fontSize: 28, ...FONT.bold },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  insightCard: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + "44",
    marginBottom: SPACING.lg,
  },
  insightText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
  },
  yourStats: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  yourStatBlock: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  yourStatValue: { fontSize: 24, ...FONT.bold },
  yourStatLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  rankCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  rankTitle: { color: COLORS.text, fontSize: 16, ...FONT.bold },
  rankSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  whoContext: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  whoContextTitle: {
    color: COLORS.text,
    fontSize: 16,
    ...FONT.bold,
    marginBottom: SPACING.sm,
  },
  whoContextText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  rowHighlight: {
    backgroundColor: COLORS.accentDim,
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  cityCol: { width: 100 },
  cityName: { color: COLORS.text, fontSize: 13, ...FONT.medium },
  barCol: { flex: 1, paddingHorizontal: SPACING.sm },
  barBg: { height: 8, backgroundColor: COLORS.cardBorder, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  valueCol: { width: 60, alignItems: "flex-end", flexDirection: "row", gap: 2 },
  value: { fontSize: 14, ...FONT.bold },
  unit: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
});
