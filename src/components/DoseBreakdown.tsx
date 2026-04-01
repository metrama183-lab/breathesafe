import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ActivityBreakdown, ACTIVITY_META } from "../types";
import { COLORS, SPACING, FONT } from "../constants/theme";

interface Props {
  breakdown: ActivityBreakdown[];
  totalCigarettes: number;
}

export default function DoseBreakdown({ breakdown, totalCigarettes }: Props) {
  const sorted = [...breakdown].sort((a, b) => b.dose_ug - a.dose_ug);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dose Breakdown</Text>
      {sorted.map((item, i) => {
        const meta = ACTIVITY_META[item.activity];
        const pct = totalCigarettes > 0
          ? (item.cigarettes / totalCigarettes) * 100
          : 0;

        return (
          <View key={i} style={styles.row}>
            <Text style={styles.emoji}>{meta?.emoji || "❓"}</Text>
            <View style={styles.info}>
              <View style={styles.labelRow}>
                <Text style={styles.activityName}>
                  {meta?.label || item.activity}
                </Text>
                <Text style={styles.cigaretteValue}>
                  {item.cigarettes.toFixed(2)} 🚬
                </Text>
              </View>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor:
                        pct > 30
                          ? COLORS.danger
                          : pct > 15
                          ? COLORS.warning
                          : COLORS.accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.detail}>
                {item.duration_hours}h · {item.effective_pm25} µg/m³ · {item.dose_ug} µg
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    ...FONT.bold,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  emoji: {
    fontSize: 24,
    marginRight: SPACING.sm + 4,
    marginTop: 2,
  },
  info: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  activityName: {
    color: COLORS.text,
    fontSize: 14,
    ...FONT.semibold,
  },
  cigaretteValue: {
    color: COLORS.textSecondary,
    fontSize: 13,
    ...FONT.medium,
  },
  barBg: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    marginBottom: 4,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  detail: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
