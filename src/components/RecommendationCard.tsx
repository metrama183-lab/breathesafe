import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT } from "../constants/theme";

interface Props {
  recommendations: string[];
}

export default function RecommendationCard({ recommendations }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Recommendations</Text>
      {recommendations.map((rec, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.text}>{rec}</Text>
        </View>
      ))}
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
    marginBottom: SPACING.sm + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 7,
    marginRight: SPACING.sm + 2,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
