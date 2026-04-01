/**
 * Health Connect Integration
 * Reads activity data from Google Health Connect (Android 14+)
 * to automatically populate the activity log.
 */

import { Platform } from "react-native";
import { ActivityEntry, ActivityType } from "../types";

let HealthConnect: any = null;

async function loadHealthConnect() {
  if (Platform.OS !== "android") return false;
  try {
    HealthConnect = require("react-native-health-connect");
    return true;
  } catch {
    return false;
  }
}

export async function isHealthConnectAvailable(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    const loaded = await loadHealthConnect();
    if (!loaded) return false;
    const result = await HealthConnect.getSdkStatus();
    return result === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function initializeHealthConnect(): Promise<boolean> {
  try {
    const loaded = await loadHealthConnect();
    if (!loaded) return false;
    await HealthConnect.initialize();
    return true;
  } catch {
    return false;
  }
}

export async function requestPermissions(): Promise<boolean> {
  try {
    if (!HealthConnect) return false;

    const permissions = [
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "ExerciseSession" },
      { accessType: "read", recordType: "SleepSession" },
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "Distance" },
    ];

    const granted = await HealthConnect.requestPermission(permissions);
    return granted.length > 0;
  } catch {
    return false;
  }
}

export async function getTodayActivities(): Promise<ActivityEntry[]> {
  if (!HealthConnect) return [];

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const timeRange = {
    operator: "between",
    startTime: startOfDay.toISOString(),
    endTime: now.toISOString(),
  };

  const activities: ActivityEntry[] = [];

  try {
    const sleepRecords = await HealthConnect.readRecords("SleepSession", { timeRangeFilter: timeRange });
    if (sleepRecords?.records?.length > 0) {
      let totalSleepHours = 0;
      for (const record of sleepRecords.records) {
        const start = new Date(record.startTime).getTime();
        const end = new Date(record.endTime).getTime();
        totalSleepHours += (end - start) / (1000 * 60 * 60);
      }
      if (totalSleepHours > 0) {
        activities.push({
          activity_type: "sleeping",
          duration_hours: Math.round(totalSleepHours * 10) / 10,
          is_outdoor: false,
        });
      }
    }
  } catch {}

  try {
    const exerciseRecords = await HealthConnect.readRecords("ExerciseSession", { timeRangeFilter: timeRange });
    if (exerciseRecords?.records?.length > 0) {
      for (const record of exerciseRecords.records) {
        const start = new Date(record.startTime).getTime();
        const end = new Date(record.endTime).getTime();
        const hours = (end - start) / (1000 * 60 * 60);

        const actType = mapExerciseType(record.exerciseType);
        if (actType && hours > 0.05) {
          activities.push({
            activity_type: actType,
            duration_hours: Math.round(hours * 10) / 10,
            is_outdoor: ["walking", "cycling", "running"].includes(actType),
          });
        }
      }
    }
  } catch {}

  try {
    const stepRecords = await HealthConnect.readRecords("Steps", { timeRangeFilter: timeRange });
    const hasWalking = activities.some(
      (a) => a.activity_type === "walking" || a.activity_type === "running"
    );

    if (!hasWalking && stepRecords?.records?.length > 0) {
      let totalSteps = 0;
      for (const record of stepRecords.records) {
        totalSteps += record.count || 0;
      }
      // ~5000 steps ≈ 40 min walking
      const walkingHours = (totalSteps / 5000) * (40 / 60);
      if (walkingHours > 0.1) {
        activities.push({
          activity_type: "walking",
          duration_hours: Math.round(walkingHours * 10) / 10,
          is_outdoor: true,
        });
      }
    }
  } catch {}

  return activities;
}

function mapExerciseType(exerciseType: number | string): ActivityType | null {
  const typeMap: Record<string, ActivityType> = {
    WALKING: "walking",
    RUNNING: "running",
    RUNNING_TREADMILL: "running",
    BIKING: "cycling",
    BIKING_STATIONARY: "cycling",
    HIKING: "walking",
    SWIMMING_POOL: "resting",
    SWIMMING_OPEN_WATER: "resting",
    YOGA: "resting",
    STRENGTH_TRAINING: "resting",
    EXERCISE_CLASS: "running",
  };

  const typeStr = String(exerciseType);
  for (const [key, value] of Object.entries(typeMap)) {
    if (typeStr.includes(key) || typeStr === key) {
      return value;
    }
  }
  // Unknown exercise types default to indoor resting (not outdoor walking)
  return "resting";
}

export async function getAverageHeartRate(): Promise<number | null> {
  if (!HealthConnect) return null;

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const records = await HealthConnect.readRecords("HeartRate", {
      timeRangeFilter: {
        operator: "between",
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });

    if (records?.records?.length > 0) {
      let sum = 0;
      let count = 0;
      for (const record of records.records) {
        for (const sample of record.samples || []) {
          sum += sample.beatsPerMinute;
          count++;
        }
      }
      return count > 0 ? Math.round(sum / count) : null;
    }
  } catch {}

  return null;
}
