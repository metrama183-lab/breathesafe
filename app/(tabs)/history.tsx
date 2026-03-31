import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import useStore from "../../src/store/useStore";
import { COLORS, SPACING, FONT } from "../../src/constants/theme";
import { DayLogEntry } from "../../src/types";

type TimeRange = "week" | "month" | "year";

function getSeverityColor(cig: number): string {
  if (cig < 1) return COLORS.accent;
  if (cig < 3) return COLORS.warning;
  return COLORS.danger;
}

function BarChart({ data, maxValue }: { data: DayLogEntry[]; maxValue: number }) {
  const BAR_MAX_HEIGHT = 120;

  return (
    <View style={barStyles.container}>
      {data.map((entry, i) => {
        const height = maxValue > 0
          ? (entry.cigarettes / maxValue) * BAR_MAX_HEIGHT
          : 0;
        const color = getSeverityColor(entry.cigarettes);
        const dayLabel = new Date(entry.date).toLocaleDateString("en", {
          day: "numeric",
        });

        return (
          <View key={entry.date} style={barStyles.barColumn}>
            <Text style={barStyles.valueLabel}>
              {entry.cigarettes.toFixed(1)}
            </Text>
            <View
              style={[
                barStyles.bar,
                {
                  height: Math.max(height, 4),
                  backgroundColor: color,
                },
              ]}
            />
            <Text style={barStyles.dayLabel}>{dayLabel}</Text>
          </View>
        );
      })}
    </View>
  );
}

function HeatmapCalendar({ data }: { data: DayLogEntry[] }) {
  const dataMap = new Map(data.map((d) => [d.date, d.cigarettes]));
  const today = new Date();
  const cells: { date: string; cig: number | null }[] = [];

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    cells.push({ date: key, cig: dataMap.get(key) ?? null });
  }

  return (
    <View style={heatStyles.container}>
      <View style={heatStyles.labels}>
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <Text key={d} style={heatStyles.label}>{d}</Text>
        ))}
      </View>
      <View style={heatStyles.grid}>
        {cells.map((cell) => (
          <View
            key={cell.date}
            style={[
              heatStyles.cell,
              {
                backgroundColor:
                  cell.cig === null
                    ? COLORS.cardBorder
                    : getSeverityColor(cell.cig) + "66",
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const history = useStore((s) => s.history);
  const [range, setRange] = useState<TimeRange>("week");

  const now = new Date();
  const filtered = history.filter((h) => {
    const d = new Date(h.date);
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (range === "week") return diffDays <= 7;
    if (range === "month") return diffDays <= 30;
    return diffDays <= 365;
  });

  const totalCigarettes = filtered.reduce((s, h) => s + h.cigarettes, 0);
  const avgCigarettes =
    filtered.length > 0 ? totalCigarettes / filtered.length : 0;
  const maxCig = filtered.length > 0
    ? Math.max(...filtered.map((h) => h.cigarettes))
    : 1;

  const trend =
    filtered.length >= 2
      ? (
          ((filtered[filtered.length - 1].cigarettes -
            filtered[0].cigarettes) /
            Math.max(filtered[0].cigarettes, 0.1)) *
          100
        ).toFixed(0)
      : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>History</Text>

      {/* Time Range Selector */}
      <View style={styles.rangeRow}>
        {(["week", "month", "year"] as TimeRange[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeChip, range === r && styles.rangeChipActive]}
            onPress={() => setRange(r)}
          >
            <Text
              style={[
                styles.rangeText,
                range === r && styles.rangeTextActive,
              ]}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {totalCigarettes.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>🚬 total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgCigarettes.toFixed(1)}</Text>
          <Text style={styles.statLabel}>🚬 / day avg</Text>
        </View>
        <View style={styles.statCard}>
          <Text
            style={[
              styles.statValue,
              trend !== null && parseInt(trend) < 0
                ? { color: COLORS.accent }
                : trend !== null && parseInt(trend) > 0
                ? { color: COLORS.danger }
                : {},
            ]}
          >
            {trend !== null ? `${parseInt(trend) > 0 ? "+" : ""}${trend}%` : "—"}
          </Text>
          <Text style={styles.statLabel}>trend</Text>
        </View>
      </View>

      {/* Bar Chart */}
      {filtered.length > 0 ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Exposure</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart data={filtered} maxValue={maxCig} />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptyText}>
            Save your daily exposure from the Day tab to see trends here.
          </Text>
        </View>
      )}

      {/* Heatmap */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Last 28 Days</Text>
        <HeatmapCalendar data={history} />
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.accent + "66" }]} />
          <Text style={styles.legendText}>Low</Text>
          <View style={[styles.legendDot, { backgroundColor: COLORS.warning + "66" }]} />
          <Text style={styles.legendText}>Moderate</Text>
          <View style={[styles.legendDot, { backgroundColor: COLORS.danger + "66" }]} />
          <Text style={styles.legendText}>High</Text>
          <View style={[styles.legendDot, { backgroundColor: COLORS.cardBorder }]} />
          <Text style={styles.legendText}>No data</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingTop: 60, paddingBottom: 40 },
  title: { color: COLORS.text, fontSize: 28, ...FONT.bold, marginBottom: SPACING.md },
  rangeRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
  rangeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  rangeChipActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  rangeText: { color: COLORS.textMuted, fontSize: 14, ...FONT.medium },
  rangeTextActive: { color: COLORS.accent },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statValue: { color: COLORS.text, fontSize: 24, ...FONT.bold },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  chartTitle: { color: COLORS.text, fontSize: 16, ...FONT.bold, marginBottom: SPACING.md },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { color: COLORS.text, fontSize: 18, ...FONT.bold, marginBottom: SPACING.sm },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: "center" },
  legend: { flexDirection: "row", alignItems: "center", marginTop: SPACING.md, gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { color: COLORS.textMuted, fontSize: 11, marginRight: 8 },
});

const barStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", gap: 6, paddingVertical: SPACING.sm },
  barColumn: { alignItems: "center", minWidth: 32 },
  bar: { width: 24, borderRadius: 4, marginVertical: 4 },
  valueLabel: { color: COLORS.textMuted, fontSize: 10 },
  dayLabel: { color: COLORS.textMuted, fontSize: 10 },
});

const heatStyles = StyleSheet.create({
  container: { gap: SPACING.xs },
  labels: { flexDirection: "row", justifyContent: "space-around" },
  label: { color: COLORS.textMuted, fontSize: 10, width: 28, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  cell: { width: 28, height: 28, borderRadius: 6 },
});
