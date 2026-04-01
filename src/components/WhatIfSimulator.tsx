import React, { useState, useMemo } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT } from "../constants/theme";
import { ActivityEntry, ActivityType } from "../types";
import { calculateDailyDose } from "../services/doseEngine";

interface WhatIfOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  transform: (activities: ActivityEntry[]) => ActivityEntry[];
  applicable: (activities: ActivityEntry[]) => boolean;
}

const WHAT_IF_OPTIONS: WhatIfOption[] = [
  {
    id: "cycling_to_metro",
    emoji: "🚲→🚇",
    label: "Take metro instead of cycling",
    description: "Enclosed cabin filters ~70% of PM2.5",
    transform: (acts) =>
      acts.map((a) =>
        a.activity_type === "cycling"
          ? { ...a, activity_type: "public_transport" as ActivityType, is_outdoor: false }
          : a
      ),
    applicable: (acts) => acts.some((a) => a.activity_type === "cycling"),
  },
  {
    id: "cycling_to_driving",
    emoji: "🚲→🚗",
    label: "Drive instead of cycling",
    description: "Car cabin with recirculation blocks ~70% PM2.5",
    transform: (acts) =>
      acts.map((a) =>
        a.activity_type === "cycling"
          ? { ...a, activity_type: "driving" as ActivityType, is_outdoor: false }
          : a
      ),
    applicable: (acts) => acts.some((a) => a.activity_type === "cycling"),
  },
  {
    id: "add_hood_gas",
    emoji: "🔥→🔥💨",
    label: "Turn on range hood (gas)",
    description: "Hood captures ~70% of cooking emissions",
    transform: (acts) =>
      acts.map((a) =>
        a.activity_type === "cooking_gas"
          ? { ...a, activity_type: "cooking_gas_hood" as ActivityType }
          : a
      ),
    applicable: (acts) => acts.some((a) => a.activity_type === "cooking_gas"),
  },
  {
    id: "add_hood_electric",
    emoji: "🍳→🍳💨",
    label: "Turn on range hood (electric)",
    description: "Hood captures ~70% of cooking aerosol",
    transform: (acts) =>
      acts.map((a) =>
        a.activity_type === "cooking_electric"
          ? { ...a, activity_type: "cooking_electric_hood" as ActivityType }
          : a
      ),
    applicable: (acts) => acts.some((a) => a.activity_type === "cooking_electric"),
  },
  {
    id: "gas_to_electric",
    emoji: "🔥→🍳",
    label: "Switch gas stove to electric",
    description: "Eliminates NO₂, benzene, and reduces PM2.5 by ~60%",
    transform: (acts) =>
      acts.map((a) =>
        a.activity_type === "cooking_gas"
          ? { ...a, activity_type: "cooking_electric" as ActivityType }
          : a.activity_type === "cooking_gas_hood"
          ? { ...a, activity_type: "cooking_electric_hood" as ActivityType }
          : a
      ),
    applicable: (acts) =>
      acts.some((a) => a.activity_type === "cooking_gas" || a.activity_type === "cooking_gas_hood"),
  },
  {
    id: "running_to_indoor",
    emoji: "🏃→🏠",
    label: "Exercise indoors instead",
    description: "Indoor PM2.5 is ~50% lower than outdoor",
    transform: (acts) =>
      acts.map((a) =>
        a.activity_type === "running"
          ? { ...a, activity_type: "resting" as ActivityType, is_outdoor: false }
          : a
      ),
    applicable: (acts) => acts.some((a) => a.activity_type === "running"),
  },
  {
    id: "walking_to_driving",
    emoji: "🚶→🚗",
    label: "Drive instead of walking",
    description: "Lower breathing rate + cabin filtration",
    transform: (acts) =>
      acts.map((a) =>
        a.activity_type === "walking"
          ? { ...a, activity_type: "driving" as ActivityType, is_outdoor: false }
          : a
      ),
    applicable: (acts) => acts.some((a) => a.activity_type === "walking"),
  },
];

interface Props {
  activities: ActivityEntry[];
  outdoorPm25: number;
  currentCigarettes: number;
}

export default function WhatIfSimulator({
  activities,
  outdoorPm25,
  currentCigarettes,
}: Props) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  const applicableOptions = useMemo(
    () => WHAT_IF_OPTIONS.filter((opt) => opt.applicable(activities)),
    [activities]
  );

  const simulatedResult = useMemo(() => {
    let modified = [...activities];
    for (const opt of applicableOptions) {
      if (enabled[opt.id]) {
        modified = opt.transform(modified);
      }
    }
    return calculateDailyDose(modified, outdoorPm25);
  }, [activities, outdoorPm25, enabled, applicableOptions]);

  const activeCount = Object.values(enabled).filter(Boolean).length;
  const saved = currentCigarettes - simulatedResult.cigarettes_equivalent;
  const savedPct =
    currentCigarettes > 0 ? (saved / currentCigarettes) * 100 : 0;

  if (applicableOptions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚡ What If...?</Text>
      <Text style={styles.subtitle}>
        Toggle changes and watch your dose drop
      </Text>

      {/* Live counter */}
      <View style={styles.counterRow}>
        <View style={styles.counterBlock}>
          <Text style={styles.counterLabel}>Current</Text>
          <Text style={[styles.counterValue, { color: COLORS.cigarette }]}>
            {currentCigarettes.toFixed(2)}
          </Text>
        </View>
        <View style={styles.counterArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
        <View style={styles.counterBlock}>
          <Text style={styles.counterLabel}>Simulated</Text>
          <Text
            style={[
              styles.counterValue,
              {
                color:
                  saved > 0 ? COLORS.accent : COLORS.cigarette,
              },
            ]}
          >
            {simulatedResult.cigarettes_equivalent.toFixed(2)}
          </Text>
        </View>
        {saved > 0 && (
          <View style={[styles.counterBlock, styles.savedBlock]}>
            <Text style={styles.counterLabel}>Saved</Text>
            <Text style={[styles.counterValue, { color: COLORS.accent }]}>
              -{saved.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Saved banner */}
      {saved > 0 && (
        <View style={styles.savedBanner}>
          <Text style={styles.savedBannerText}>
            🎯 {savedPct.toFixed(0)}% less exposure with{" "}
            {activeCount} change{activeCount > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Toggle options */}
      {applicableOptions.map((opt) => {
        const isOn = enabled[opt.id] ?? false;

        let optionSaved = 0;
        if (!isOn) {
          const singleEnabled = { ...enabled, [opt.id]: true };
          let modified = [...activities];
          for (const o of applicableOptions) {
            if (singleEnabled[o.id]) {
              modified = o.transform(modified);
            }
          }
          const singleResult = calculateDailyDose(modified, outdoorPm25);
          optionSaved =
            simulatedResult.cigarettes_equivalent -
            singleResult.cigarettes_equivalent;
        }

        return (
          <View key={opt.id} style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.description}</Text>
              </View>
            </View>
            <View style={styles.optionRight}>
              {!isOn && optionSaved > 0.01 && (
                <Text style={styles.optionSaved}>
                  -{optionSaved.toFixed(2)} 🚬
                </Text>
              )}
              <Switch
                value={isOn}
                onValueChange={(v) =>
                  setEnabled((prev) => ({ ...prev, [opt.id]: v }))
                }
                trackColor={{
                  false: COLORS.cardBorder,
                  true: COLORS.accent + "66",
                }}
                thumbColor={isOn ? COLORS.accent : COLORS.textMuted}
              />
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
    borderColor: COLORS.accent + "44",
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    ...FONT.bold,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  counterBlock: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: SPACING.sm + 2,
  },
  savedBlock: {
    backgroundColor: COLORS.accentDim,
  },
  counterLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    ...FONT.medium,
    marginBottom: 2,
  },
  counterValue: {
    fontSize: 22,
    ...FONT.heavy,
  },
  counterArrow: {
    paddingHorizontal: 2,
  },
  arrowText: {
    color: COLORS.textMuted,
    fontSize: 18,
  },
  savedBanner: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 10,
    padding: SPACING.sm + 4,
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  savedBannerText: {
    color: COLORS.accent,
    fontSize: 14,
    ...FONT.bold,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.sm,
  },
  optionEmoji: {
    fontSize: 22,
    marginRight: SPACING.sm + 2,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    color: COLORS.text,
    fontSize: 14,
    ...FONT.semibold,
  },
  optionDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  optionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  optionSaved: {
    color: COLORS.accent,
    fontSize: 12,
    ...FONT.bold,
  },
});
