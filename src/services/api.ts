/**
 * API service for communicating with the BreatheSafe backend.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCityAirQuality(city: string) {
  return fetchJSON(`/air/city/${encodeURIComponent(city)}`);
}

export async function getLocationAirQuality(lat: number, lon: number) {
  return fetchJSON(`/air/location?lat=${lat}&lon=${lon}`);
}

export async function calculateDose(dayLog: {
  city: string;
  country_code: string;
  activities: Array<{
    activity_type: string;
    duration_hours: number;
    is_outdoor: boolean;
  }>;
}) {
  return fetchJSON("/dose/calculate", {
    method: "POST",
    body: JSON.stringify(dayLog),
  });
}

export async function getHealthImpact(city: string, cigarettesPerDay: number) {
  return fetchJSON(
    `/health/impact?city=${encodeURIComponent(city)}&cigarettes_per_day=${cigarettesPerDay}`
  );
}

export async function compareCities() {
  return fetchJSON("/compare/cities");
}

export async function listCities(): Promise<string[]> {
  return fetchJSON("/cities");
}
