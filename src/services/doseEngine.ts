/**
 * Client-side dose engine for offline calculations.
 * Full mirror of backend logic for instant UI updates.
 */

import { ActivityEntry, ActivityBreakdown, DoseResult, HealthImpact } from "../types";
import {
  BREATHING_RATES,
  MICROENVIRONMENT,
  CIGARETTE_CONSTANT,
  WHO_PM25_LIMIT,
  HOURS_LOST_PER_UG_ANNUAL,
  RELATIVE_RISK_PER_10UG,
} from "../constants/science";

export function calculateActivityDose(
  activity: ActivityEntry,
  outdoorPm25: number
): ActivityBreakdown {
  const [multiplier, additive] = MICROENVIRONMENT[activity.activity_type];
  const effectivePm25 = activity.is_outdoor
    ? outdoorPm25
    : outdoorPm25 * multiplier + additive;

  const breathingRate = BREATHING_RATES[activity.activity_type];
  const doseUg = effectivePm25 * breathingRate * activity.duration_hours;
  const cigarettes =
    (effectivePm25 / CIGARETTE_CONSTANT) * (activity.duration_hours / 24.0);

  return {
    activity: activity.activity_type,
    duration_hours: activity.duration_hours,
    effective_pm25: Math.round(effectivePm25 * 10) / 10,
    breathing_rate: breathingRate,
    dose_ug: Math.round(doseUg * 10) / 10,
    cigarettes: Math.round(cigarettes * 1000) / 1000,
  };
}

export function calculateDailyDose(
  activities: ActivityEntry[],
  outdoorPm25: number
): DoseResult {
  const breakdown: ActivityBreakdown[] = [];
  let totalDose = 0;
  let totalCigarettes = 0;

  for (const activity of activities) {
    const result = calculateActivityDose(activity, outdoorPm25);
    breakdown.push(result);
    totalDose += result.dose_ug;
    totalCigarettes += result.cigarettes;
  }

  const recommendations = generateRecommendations(breakdown, outdoorPm25);

  return {
    total_dose_ug: Math.round(totalDose * 10) / 10,
    cigarettes_equivalent: Math.round(totalCigarettes * 100) / 100,
    breakdown,
    pm25_outdoor: outdoorPm25,
    recommendations,
  };
}

export function calculateHealthImpact(
  annualAvgPm25: number,
  cigarettesPerDay: number
): HealthImpact {
  const whoRatio = annualAvgPm25 / WHO_PM25_LIMIT;
  const excess = Math.max(0, annualAvgPm25 - WHO_PM25_LIMIT);
  const hoursLost = excess * HOURS_LOST_PER_UG_ANNUAL;
  const riskIncrease = (annualAvgPm25 / 10.0) * RELATIVE_RISK_PER_10UG * 100;

  return {
    annual_cigarettes: Math.round(cigarettesPerDay * 365),
    who_limit_ratio: Math.round(whoRatio * 10) / 10,
    estimated_hours_lost_per_year: Math.round(hoursLost * 10) / 10,
    respiratory_risk_increase_pct: Math.round(riskIncrease * 10) / 10,
    sources: [
      "Berkeley Earth (2015)",
      "Pope et al. (2002, 2016)",
      "WHO AirQ+",
      "AQLI, University of Chicago",
      "US EPA Exposure Factors Handbook",
    ],
  };
}

function generateRecommendations(
  breakdown: ActivityBreakdown[],
  outdoorPm25: number
): string[] {
  const recs: string[] = [];
  const sorted = [...breakdown].sort((a, b) => b.dose_ug - a.dose_ug);
  const top = sorted[0];

  if (top && (top.activity === "cooking_gas" || top.activity === "cooking_electric")) {
    const saved = top.dose_ug * 0.7;
    recs.push(`Turn on the range hood when cooking: save ~${saved.toFixed(0)} µg`);
  }

  if (top && top.activity === "cooking_gas") {
    recs.push(
      "Gas stoves emit NO₂ and benzene. Consider electric/induction for cleaner air."
    );
  }

  const cycling = breakdown.filter((a) => a.activity === "cycling");
  for (const c of cycling) {
    if (outdoorPm25 > 25) {
      recs.push(
        `High pollution (${outdoorPm25.toFixed(0)} µg/m³). Public transport saves ~60% exposure vs cycling.`
      );
    }
  }

  const running = breakdown.filter((a) => a.activity === "running");
  for (const _ of running) {
    if (outdoorPm25 > 20) {
      recs.push(
        "Exercise early morning (6-7 AM) when PM2.5 is typically 30-40% lower."
      );
    }
  }

  if (outdoorPm25 < 15) {
    recs.push("Air quality is good today. Great time for outdoor exercise!");
  }

  if (outdoorPm25 > WHO_PM25_LIMIT * 3) {
    recs.push(
      `Air is ${(outdoorPm25 / WHO_PM25_LIMIT).toFixed(0)}x WHO limit. Keep windows closed.`
    );
  }

  return recs;
}
