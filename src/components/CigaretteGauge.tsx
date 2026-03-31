import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT } from "../constants/theme";

interface Props {
  cigarettes: number;
  pm25: number;
}

function getSeverity(cig: number): {
  color: string;
  label: string;
  bg: string;
} {
  if (cig < 1) return { color: COLORS.accent, label: "Low", bg: COLORS.accentDim };
  if (cig < 3) return { color: COLORS.warning, label: "Moderate", bg: COLORS.warningDim };
  return { color: COLORS.danger, label: "High", bg: COLORS.dangerDim };
}

export default function CigaretteGauge({ cigarettes, pm25 }: Props) {
  const severity = getSeverity(cigarettes);
  const wholePart = Math.floor(cigarettes);
  const decimalPart = (cigarettes - wholePart).toFixed(1).substring(1);

  return (
    <View style={styles.container}>
      <View style={[styles.ring, { borderColor: severity.color }]}>
        <Text style={[styles.number, { color: severity.color }]}>
          {wholePart}
          <Text style={styles.decimal}>{decimalPart}</Text>
        </Text>
        <Text style={styles.cigaretteEmoji}>🚬</Text>
      </View>

      <Text style={styles.label}>cigarettes today</Text>

      <View style={[styles.badge, { backgroundColor: severity.bg }]}>
        <Text style={[styles.badgeText, { color: severity.color }]}>
          {severity.label} · PM2.5: {pm25.toFixed(0)} µg/m³
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  ring: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  number: {
    fontSize: 56,
    ...FONT.heavy,
  },
  decimal: {
    fontSize: 32,
    ...FONT.medium,
  },
  cigaretteEmoji: {
    fontSize: 24,
    marginTop: -4,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 16,
    ...FONT.medium,
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    ...FONT.semibold,
  },
});
