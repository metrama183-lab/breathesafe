import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityEntry,
  DayLogEntry,
  DayTemplate,
  DoseResult,
  ActivityType,
} from "../types";
import { calculateDailyDose } from "../services/doseEngine";
import {
  isHealthConnectAvailable,
  initializeHealthConnect,
  requestPermissions,
  getTodayActivities,
} from "../services/healthConnect";

const STORAGE_KEYS = {
  CITY: "breathesafe_city",
  TEMPLATES: "breathesafe_templates",
  HISTORY: "breathesafe_history",
  ONBOARDED: "breathesafe_onboarded",
} as const;

interface AppState {
  city: string;
  countryCode: string;
  pm25: number;
  isLoading: boolean;
  hasOnboarded: boolean;
  healthConnectAvailable: boolean;
  healthConnectEnabled: boolean;

  todayActivities: ActivityEntry[];
  todayResult: DoseResult | null;

  templates: DayTemplate[];
  history: DayLogEntry[];

  setCity: (city: string, countryCode: string) => void;
  setPm25: (pm25: number) => void;
  fetchAirQuality: (city: string) => Promise<void>;

  setTodayActivities: (activities: ActivityEntry[]) => void;
  addActivity: (activity: ActivityEntry) => void;
  removeActivity: (index: number) => void;
  recalculate: () => void;

  applyTemplate: (template: DayTemplate) => void;
  saveTemplate: (name: string) => void;
  deleteTemplate: (id: string) => void;

  saveDayToHistory: () => void;

  setOnboarded: () => void;
  loadPersistedData: () => Promise<void>;
  syncHealthConnect: () => Promise<void>;
  enableHealthConnect: () => Promise<boolean>;
}

const DEFAULT_WORKDAY: ActivityEntry[] = [
  { activity_type: "sleeping", duration_hours: 8, is_outdoor: false },
  { activity_type: "cycling", duration_hours: 0.5, is_outdoor: true },
  { activity_type: "office", duration_hours: 8, is_outdoor: false },
  { activity_type: "cycling", duration_hours: 0.5, is_outdoor: true },
  { activity_type: "cooking_gas", duration_hours: 1, is_outdoor: false },
  { activity_type: "resting", duration_hours: 6, is_outdoor: false },
];

const DEFAULT_WEEKEND: ActivityEntry[] = [
  { activity_type: "sleeping", duration_hours: 9, is_outdoor: false },
  { activity_type: "resting", duration_hours: 4, is_outdoor: false },
  { activity_type: "walking", duration_hours: 2, is_outdoor: true },
  { activity_type: "cooking_gas", duration_hours: 1.5, is_outdoor: false },
  { activity_type: "resting", duration_hours: 7.5, is_outdoor: false },
];

const useStore = create<AppState>((set, get) => ({
  city: "Milano",
  countryCode: "IT",
  pm25: 25,
  isLoading: true,
  hasOnboarded: false,
  healthConnectAvailable: false,
  healthConnectEnabled: false,

  todayActivities: DEFAULT_WORKDAY,
  todayResult: null,

  templates: [
    { id: "workday", name: "Workday", activities: DEFAULT_WORKDAY },
    { id: "weekend", name: "Weekend", activities: DEFAULT_WEEKEND },
  ],
  history: [],

  setCity: async (city, countryCode) => {
    set({ city, countryCode });
    AsyncStorage.setItem(STORAGE_KEYS.CITY, JSON.stringify({ city, countryCode }));
    await get().fetchAirQuality(city);
  },

  setPm25: (pm25) => {
    set({ pm25 });
    get().recalculate();
  },

  fetchAirQuality: async (city) => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000"}/air/city/${encodeURIComponent(city)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.pm25 && data.pm25 > 0) {
          set({ pm25: data.pm25 });
          get().recalculate();
          return;
        }
      }
    } catch {}
    // Fallback: use known city averages when backend is unavailable
    const FALLBACK: Record<string, number> = {
      milano: 25, roma: 16, torino: 28, napoli: 18, bologna: 22,
      firenze: 15, london: 11, paris: 14, berlin: 12, madrid: 10,
      barcelona: 13, amsterdam: 11, stockholm: 6, wien: 13, zürich: 10,
      bruxelles: 12, lisboa: 9, warszawa: 21, praha: 17, budapest: 19,
      "new delhi": 99, beijing: 42, tokyo: 12, "new york": 10,
      "los angeles": 14, "são paulo": 17,
    };
    const fallback = FALLBACK[city.toLowerCase()] ?? 15;
    set({ pm25: fallback });
    get().recalculate();
  },

  setTodayActivities: (activities) => {
    set({ todayActivities: activities });
    get().recalculate();
  },

  addActivity: (activity) => {
    const current = get().todayActivities;
    set({ todayActivities: [...current, activity] });
    get().recalculate();
  },

  removeActivity: (index) => {
    const current = [...get().todayActivities];
    current.splice(index, 1);
    set({ todayActivities: current });
    get().recalculate();
  },

  recalculate: () => {
    const { todayActivities, pm25 } = get();
    if (todayActivities.length === 0) {
      set({ todayResult: null });
      return;
    }
    const result = calculateDailyDose(todayActivities, pm25);
    set({ todayResult: result });
  },

  applyTemplate: (template) => {
    set({ todayActivities: [...template.activities] });
    get().recalculate();
  },

  saveTemplate: (name) => {
    const { todayActivities, templates } = get();
    const newTemplate: DayTemplate = {
      id: Date.now().toString(),
      name,
      activities: [...todayActivities],
    };
    const updated = [...templates, newTemplate];
    set({ templates: updated });
    AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  },

  deleteTemplate: (id) => {
    const updated = get().templates.filter((t) => t.id !== id);
    set({ templates: updated });
    AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  },

  saveDayToHistory: () => {
    const { city, todayResult, todayActivities, pm25, history } = get();
    if (!todayResult) return;

    const today = new Date().toISOString().split("T")[0];
    const existing = history.findIndex((h) => h.date === today);

    const entry: DayLogEntry = {
      date: today,
      city,
      cigarettes: todayResult.cigarettes_equivalent,
      dose_ug: todayResult.total_dose_ug,
      pm25_outdoor: pm25,
      breakdown: todayResult.breakdown,
    };

    let updated: DayLogEntry[];
    if (existing >= 0) {
      updated = [...history];
      updated[existing] = entry;
    } else {
      updated = [...history, entry];
    }

    updated.sort((a, b) => a.date.localeCompare(b.date));
    set({ history: updated });
    AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  },

  setOnboarded: () => {
    set({ hasOnboarded: true });
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, "true");
  },

  syncHealthConnect: async () => {
    const { healthConnectEnabled } = get();
    if (!healthConnectEnabled) return;

    try {
      const hcActivities = await getTodayActivities();
      if (hcActivities.length > 0) {
        const current = get().todayActivities;
        // Keep manually-added activities (cooking etc) and replace auto-detected ones
        const manualTypes = new Set([
          "cooking_gas", "cooking_electric", "cooking_gas_hood",
          "cooking_electric_hood", "driving", "public_transport",
        ]);
        const manualActivities = current.filter((a) =>
          manualTypes.has(a.activity_type)
        );
        const merged = [...hcActivities, ...manualActivities];
        set({ todayActivities: merged });
        get().recalculate();
      }
    } catch (e) {
      console.error("Health Connect sync failed:", e);
    }
  },

  enableHealthConnect: async () => {
    try {
      const initialized = await initializeHealthConnect();
      if (!initialized) return false;

      const granted = await requestPermissions();
      if (granted) {
        set({ healthConnectEnabled: true });
        await get().syncHealthConnect();
        return true;
      }
    } catch (e) {
      console.error("Health Connect enable failed:", e);
    }
    return false;
  },

  loadPersistedData: async () => {
    try {
      const [cityJson, templatesJson, historyJson, onboarded] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.CITY),
          AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES),
          AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED),
        ]);

      const updates: Partial<AppState> = { isLoading: false };

      if (cityJson) {
        const { city, countryCode } = JSON.parse(cityJson);
        updates.city = city;
        updates.countryCode = countryCode;
      }
      if (templatesJson) updates.templates = JSON.parse(templatesJson);
      if (historyJson) updates.history = JSON.parse(historyJson);
      if (onboarded === "true") updates.hasOnboarded = true;

      const hcAvailable = await isHealthConnectAvailable();
      updates.healthConnectAvailable = hcAvailable;

      set(updates);
      get().recalculate();
      // Fetch real air quality for the user's city
      const currentCity = updates.city || get().city;
      get().fetchAirQuality(currentCity);
    } catch (e) {
      console.error("Failed to load persisted data:", e);
      set({ isLoading: false });
    }
  },
}));

export default useStore;
