import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import useStore from "../../src/store/useStore";
import CigaretteGauge from "../../src/components/CigaretteGauge";
import DoseBreakdown from "../../src/components/DoseBreakdown";
import RecommendationCard from "../../src/components/RecommendationCard";
import { COLORS, SPACING, FONT } from "../../src/constants/theme";
import { WHO_PM25_LIMIT } from "../../src/constants/science";

export default function HomeScreen() {
  const city = useStore((s) => s.city);
  const pm25 = useStore((s) => s.pm25);
  const todayResult = useStore((s) => s.todayResult);
  const recalculate = useStore((s) => s.recalculate);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    recalculate();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    recalculate();
    setRefreshing(false);
  };

  const cigarettes = todayResult?.cigarettes_equivalent ?? 0;
  const whoMultiple = pm25 / WHO_PM25_LIMIT;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.appName}>BreatheSafe</Text>
        <Text style={styles.location}>📍 {city}</Text>
      </View>

      <CigaretteGauge cigarettes={cigarettes} pm25={pm25} />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {todayResult?.total_dose_ug.toFixed(0) ?? "—"}
          </Text>
          <Text style={styles.statUnit}>µg inhaled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, whoMultiple > 3 ? { color: COLORS.danger } : null]}>
            {whoMultiple.toFixed(1)}x
          </Text>
          <Text style={styles.statUnit}>WHO limit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {todayResult?.breakdown.length ?? 0}
          </Text>
          <Text style={styles.statUnit}>activities</Text>
        </View>
      </View>

      {todayResult && (
        <>
          <DoseBreakdown
            breakdown={todayResult.breakdown}
            totalCigarettes={cigarettes}
          />
          <View style={{ height: SPACING.md }} />
          <RecommendationCard recommendations={todayResult.recommendations} />
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Based on Berkeley Earth, WHO AirQ+, EPA Exposure Factors Handbook
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  appName: {
    color: COLORS.text,
    fontSize: 24,
    ...FONT.bold,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: 15,
    ...FONT.medium,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 22,
    ...FONT.bold,
  },
  statUnit: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    ...FONT.medium,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
