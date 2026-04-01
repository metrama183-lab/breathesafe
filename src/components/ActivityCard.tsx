import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ActivityEntry, ACTIVITY_META } from "../types";
import { COLORS, SPACING, FONT } from "../constants/theme";

interface Props {
  activity: ActivityEntry;
  index: number;
  onRemove: (index: number) => void;
}

export default function ActivityCard({ activity, index, onRemove }: Props) {
  const meta = ACTIVITY_META[activity.activity_type];

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{meta?.emoji || "❓"}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{meta?.label || activity.activity_type}</Text>
        <Text style={styles.duration}>
          {activity.duration_hours}h ·{" "}
          {activity.is_outdoor ? "outdoor" : "indoor"}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onRemove(index)} style={styles.removeBtn}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
  },
  emoji: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  info: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    ...FONT.semibold,
  },
  duration: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dangerDim,
    justifyContent: "center",
    alignItems: "center",
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 14,
    ...FONT.bold,
  },
});
