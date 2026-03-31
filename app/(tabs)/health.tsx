import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import useStore from "../../src/store/useStore";
import { calculateHealthImpact } from "../../src/services/doseEngine";
import { COLORS, SPACING, FONT } from "../../src/constants/theme";
import { WHO_PM25_LIMIT } from "../../src/constants/science";

function ProgressBar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={pbStyles.container}>
      <View style={pbStyles.labelRow}>
        <Text style={pbStyles.label}>{label}</Text>
        <Text style={[pbStyles.value, { color }]}>{value.toFixed(1)}</Text>
      </View>
      <View style={pbStyles.barBg}>
        <View style={[pbStyles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function InfoCard({
  emoji,
  title,
  value,
  unit,
  description,
  color,
}: {
  emoji: string;
  title: string;
  value: string;
  unit: string;
  description: string;
  color: string;
}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.emoji}>{emoji}</Text>
        <Text style={cardStyles.title}>{title}</Text>
      </View>
      <Text style={[cardStyles.value, { color }]}>{value}</Text>
      <Text style={cardStyles.unit}>{unit}</Text>
      <Text style={cardStyles.description}>{description}</Text>
    </View>
  );
}

export default function HealthScreen() {
  const pm25 = useStore((s) => s.pm25);
  const city = useStore((s) => s.city);
  const todayResult = useStore((s) => s.todayResult);
  const history = useStore((s) => s.history);

  const cigarettesPerDay = todayResult?.cigarettes_equivalent ?? pm25 / 22;

  const avgPm25 = useMemo(() => {
    if (history.length > 0) {
      return history.reduce((s, h) => s + h.pm25_outdoor, 0) / history.length;
    }
    return pm25;
  }, [history, pm25]);

  const impact = useMemo(
    () => calculateHealthImpact(avgPm25, cigarettesPerDay),
    [avgPm25, cigarettesPerDay]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Health Impact</Text>
      <Text style={styles.subtitle}>
        Based on your exposure in {city}
      </Text>

      {/* WHO Limit Comparison */}
      <View style={styles.whoCard}>
        <Text style={styles.whoTitle}>WHO PM2.5 Guideline</Text>
        <View style={styles.whoComparison}>
          <View style={styles.whoBlock}>
            <Text style={styles.whoValue}>{WHO_PM25_LIMIT}</Text>
            <Text style={styles.whoLabel}>WHO limit</Text>
          </View>
          <View style={styles.whoArrow}>
            <Text style={styles.whoArrowText}>→</Text>
          </View>
          <View style={styles.whoBlock}>
            <Text style={[styles.whoValue, { color: COLORS.danger }]}>
              {avgPm25.toFixed(0)}
            </Text>
            <Text style={styles.whoLabel}>Your exposure</Text>
          </View>
          <View style={styles.whoArrow}>
            <Text style={styles.whoArrowText}>=</Text>
          </View>
          <View style={styles.whoBlock}>
            <Text style={[styles.whoValue, { color: COLORS.warning }]}>
              {impact.who_limit_ratio}x
            </Text>
            <Text style={styles.whoLabel}>over limit</Text>
          </View>
        </View>
        <ProgressBar
          value={avgPm25}
          max={Math.max(avgPm25 * 1.2, 50)}
          color={avgPm25 > 15 ? COLORS.danger : COLORS.warning}
          label={`µg/m³ (WHO safe: ${WHO_PM25_LIMIT})`}
        />
      </View>

      {/* Impact Cards */}
      <View style={styles.cardsGrid}>
        <InfoCard
          emoji="🚬"
          title="Annual Cigarettes"
          value={impact.annual_cigarettes.toFixed(0)}
          unit="cigarettes / year"
          description={`That's ${(impact.annual_cigarettes / 20).toFixed(0)} packs of cigarettes your lungs process from air pollution alone.`}
          color={COLORS.cigarette}
        />
        <InfoCard
          emoji="⏳"
          title="Life Expectancy"
          value={impact.estimated_hours_lost_per_year.toFixed(1)}
          unit="hours lost / year"
          description="Estimated based on WHO AirQ+ methodology and AQLI (University of Chicago) research on PM2.5 mortality."
          color={COLORS.danger}
        />
        <InfoCard
          emoji="🫁"
          title="Respiratory Risk"
          value={`+${impact.respiratory_risk_increase_pct.toFixed(1)}%`}
          unit="increased risk"
          description="Relative risk increase for respiratory diseases compared to breathing air within WHO limits. Based on Pope et al. cohort studies."
          color={COLORS.warning}
        />
        {todayResult && todayResult.cigarettes_equivalent > 0 && (
          <InfoCard
            emoji="👶"
            title="Child Exposure"
            value={(todayResult.cigarettes_equivalent * 2.5).toFixed(1)}
            unit="effective cigarettes / day"
            description="Children inhale 2-3x more air per kg of body weight. Their effective exposure is significantly higher than adults in the same environment."
            color={COLORS.danger}
          />
        )}
      </View>

      {/* Sources */}
      <View style={styles.sourcesCard}>
        <Text style={styles.sourcesTitle}>Scientific Sources</Text>
        {impact.sources.map((source, i) => (
          <Text key={i} style={styles.sourceItem}>• {source}</Text>
        ))}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            These are population-level statistical estimates, not individual medical
            diagnoses. Consult a healthcare professional for personal health advice.
          </Text>
        </View>
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
  whoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  whoTitle: { color: COLORS.text, fontSize: 16, ...FONT.bold, marginBottom: SPACING.md },
  whoComparison: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  whoBlock: { alignItems: "center" },
  whoValue: { color: COLORS.accent, fontSize: 28, ...FONT.bold },
  whoLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  whoArrow: { paddingHorizontal: 4 },
  whoArrowText: { color: COLORS.textMuted, fontSize: 20 },
  cardsGrid: { gap: SPACING.md, marginBottom: SPACING.md },
  sourcesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sourcesTitle: {
    color: COLORS.text,
    fontSize: 16,
    ...FONT.bold,
    marginBottom: SPACING.md,
  },
  sourceItem: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  disclaimer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.warningDim,
    borderRadius: 10,
  },
  disclaimerText: { color: COLORS.warning, fontSize: 12, lineHeight: 18 },
});

const pbStyles = StyleSheet.create({
  container: { marginBottom: SPACING.sm },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: COLORS.textMuted, fontSize: 12 },
  value: { fontSize: 13, ...FONT.bold },
  barBg: { height: 8, backgroundColor: COLORS.cardBorder, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm },
  emoji: { fontSize: 24, marginRight: SPACING.sm },
  title: { color: COLORS.textSecondary, fontSize: 14, ...FONT.semibold },
  value: { fontSize: 36, ...FONT.heavy, marginBottom: 2 },
  unit: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.sm },
  description: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
});
