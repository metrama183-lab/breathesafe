export type ActivityType =
  | "sleeping"
  | "resting"
  | "walking"
  | "cycling"
  | "running"
  | "driving"
  | "public_transport"
  | "cooking_gas"
  | "cooking_electric"
  | "cooking_gas_hood"
  | "cooking_electric_hood"
  | "office";

export interface ActivityEntry {
  activity_type: ActivityType;
  duration_hours: number;
  is_outdoor: boolean;
}

export interface ActivityBreakdown {
  activity: ActivityType;
  duration_hours: number;
  effective_pm25: number;
  breathing_rate: number;
  dose_ug: number;
  cigarettes: number;
}

export interface DoseResult {
  total_dose_ug: number;
  cigarettes_equivalent: number;
  breakdown: ActivityBreakdown[];
  pm25_outdoor: number;
  recommendations: string[];
}

export interface HealthImpact {
  annual_cigarettes: number;
  who_limit_ratio: number;
  estimated_hours_lost_per_year: number;
  respiratory_risk_increase_pct: number;
  sources: string[];
}

export interface CityComparison {
  city: string;
  pm25_avg: number;
  cigarettes_per_day: number;
  annual_cigarettes: number;
}

export interface DayTemplate {
  id: string;
  name: string;
  activities: ActivityEntry[];
}

export interface DayLogEntry {
  date: string;
  city: string;
  cigarettes: number;
  dose_ug: number;
  pm25_outdoor: number;
  breakdown: ActivityBreakdown[];
}

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; emoji: string; isOutdoor: boolean; category: string }
> = {
  sleeping: { label: "Sleeping", emoji: "😴", isOutdoor: false, category: "rest" },
  resting: { label: "Home / Relaxing", emoji: "🏠", isOutdoor: false, category: "rest" },
  walking: { label: "Walking", emoji: "🚶", isOutdoor: true, category: "active" },
  cycling: { label: "Cycling", emoji: "🚲", isOutdoor: true, category: "active" },
  running: { label: "Running", emoji: "🏃", isOutdoor: true, category: "active" },
  driving: { label: "Driving", emoji: "🚗", isOutdoor: false, category: "transport" },
  public_transport: { label: "Bus / Metro", emoji: "🚇", isOutdoor: false, category: "transport" },
  cooking_gas: { label: "Cooking (gas)", emoji: "🔥", isOutdoor: false, category: "indoor" },
  cooking_electric: { label: "Cooking (electric)", emoji: "🍳", isOutdoor: false, category: "indoor" },
  cooking_gas_hood: { label: "Cooking (gas + hood)", emoji: "🔥", isOutdoor: false, category: "indoor" },
  cooking_electric_hood: { label: "Cooking (electric + hood)", emoji: "🍳", isOutdoor: false, category: "indoor" },
  office: { label: "Office / School", emoji: "💼", isOutdoor: false, category: "rest" },
};
