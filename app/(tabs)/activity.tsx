import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import useStore from "../../src/store/useStore";
import ActivityCard from "../../src/components/ActivityCard";
import { ACTIVITY_META, ActivityType, ActivityEntry } from "../../src/types";
import { COLORS, SPACING, FONT } from "../../src/constants/theme";

const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_META) as [
  ActivityType,
  (typeof ACTIVITY_META)[ActivityType],
][];

export default function ActivityScreen() {
  const todayActivities = useStore((s) => s.todayActivities);
  const addActivity = useStore((s) => s.addActivity);
  const removeActivity = useStore((s) => s.removeActivity);
  const templates = useStore((s) => s.templates);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const saveTemplate = useStore((s) => s.saveTemplate);
  const saveDayToHistory = useStore((s) => s.saveDayToHistory);
  const todayResult = useStore((s) => s.todayResult);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [duration, setDuration] = useState("1");
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const totalHours = todayActivities.reduce((s, a) => s + a.duration_hours, 0);

  const handleAddActivity = () => {
    if (!selectedType) return;
    const meta = ACTIVITY_META[selectedType];
    const entry: ActivityEntry = {
      activity_type: selectedType,
      duration_hours: parseFloat(duration) || 1,
      is_outdoor: meta.isOutdoor,
    };
    addActivity(entry);
    setShowAddModal(false);
    setSelectedType(null);
    setDuration("1");
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplate(templateName.trim());
    setTemplateName("");
    setShowSaveTemplate(false);
  };

  const handleSaveDay = () => {
    saveDayToHistory();
    Alert.alert("Saved", "Today's exposure has been saved to your history.");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Day</Text>
      <Text style={styles.subtitle}>
        {totalHours.toFixed(1)}h logged · {todayActivities.length} activities
        {todayResult
          ? ` · ${todayResult.cigarettes_equivalent.toFixed(1)} 🚬`
          : ""}
      </Text>

      {/* Templates */}
      <Text style={styles.sectionTitle}>Quick Templates</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.templateScroll}
      >
        {templates.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.templateChip}
            onPress={() => applyTemplate(t)}
          >
            <Text style={styles.templateText}>{t.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.templateChip, styles.templateChipSave]}
          onPress={() => setShowSaveTemplate(true)}
        >
          <Text style={[styles.templateText, { color: COLORS.accent }]}>
            + Save current
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Activity List */}
      <Text style={styles.sectionTitle}>Activities</Text>
      {todayActivities.map((a, i) => (
        <ActivityCard
          key={`${a.activity_type}-${i}`}
          activity={a}
          index={i}
          onRemove={removeActivity}
        />
      ))}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Activity</Text>
      </TouchableOpacity>

      {todayActivities.length > 0 && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveDay}>
          <Text style={styles.saveButtonText}>Save Today to History</Text>
        </TouchableOpacity>
      )}

      {/* Add Activity Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Activity</Text>

            <ScrollView style={styles.activityGrid}>
              {ACTIVITY_OPTIONS.map(([type, meta]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.activityOption,
                    selectedType === type && styles.activityOptionSelected,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={styles.optionEmoji}>{meta.emoji}</Text>
                  <Text style={styles.optionLabel}>{meta.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.durationLabel}>Duration (hours)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !selectedType && { opacity: 0.4 },
                ]}
                onPress={handleAddActivity}
                disabled={!selectedType}
              >
                <Text style={styles.confirmBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Template Modal */}
      <Modal visible={showSaveTemplate} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Save as Template</Text>
            <TextInput
              style={styles.input}
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="e.g. Workday, Weekend..."
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowSaveTemplate(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSaveTemplate}
              >
                <Text style={styles.confirmBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    ...FONT.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  templateScroll: { marginBottom: SPACING.lg },
  templateChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  templateChipSave: {
    borderColor: COLORS.accent,
    borderStyle: "dashed",
  },
  templateText: { color: COLORS.text, fontSize: 14, ...FONT.medium },
  addButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: "dashed",
    marginTop: SPACING.sm,
  },
  addButtonText: { color: COLORS.accent, fontSize: 15, ...FONT.semibold },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  saveButtonText: { color: COLORS.bg, fontSize: 16, ...FONT.bold },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: "80%",
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    ...FONT.bold,
    marginBottom: SPACING.lg,
  },
  activityGrid: { maxHeight: 300 },
  activityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.xs,
  },
  activityOptionSelected: {
    backgroundColor: COLORS.accentDim,
  },
  optionEmoji: { fontSize: 24, marginRight: SPACING.md },
  optionLabel: { color: COLORS.text, fontSize: 15, ...FONT.medium },
  durationLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    borderRadius: 10,
    padding: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalButtons: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  cancelBtnText: { color: COLORS.textSecondary, fontSize: 16, ...FONT.semibold },
  confirmBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.accent,
  },
  confirmBtnText: { color: COLORS.bg, fontSize: 16, ...FONT.bold },
});
