/**
 * Scientific constants for client-side dose calculations.
 * Mirrors the backend dose_engine.py for offline capability.
 *
 * Sources:
 * - US EPA Exposure Factors Handbook, Ch.6
 * - Berkeley Earth (2015) cigarette equivalence
 * - WHO AirQ+ methodology
 * - AQLI, University of Chicago
 */

import { ActivityType } from "../types";

export const BREATHING_RATES: Record<ActivityType, number> = {
  sleeping: 0.3,
  resting: 0.5,
  walking: 1.5,
  cycling: 2.5,
  running: 3.2,
  driving: 0.5,
  public_transport: 0.5,
  cooking_gas: 0.5,
  cooking_electric: 0.5,
  cooking_gas_hood: 0.5,
  cooking_electric_hood: 0.5,
  office: 0.5,
};

// [outdoor_multiplier, indoor_additive_ug_m3]
export const MICROENVIRONMENT: Record<ActivityType, [number, number]> = {
  sleeping: [0.5, 0],
  resting: [0.5, 0],
  walking: [1.0, 0],
  cycling: [1.0, 0],
  running: [1.0, 0],
  driving: [0.3, 0],
  public_transport: [0.8, 0],
  cooking_gas: [0.5, 200],
  cooking_electric: [0.5, 80],
  cooking_gas_hood: [0.5, 60],
  cooking_electric_hood: [0.5, 24],
  office: [0.5, 0],
};

export const CIGARETTE_CONSTANT = 22.0;
export const WHO_PM25_LIMIT = 5.0;
export const HOURS_LOST_PER_UG_ANNUAL = 1.15;
export const RELATIVE_RISK_PER_10UG = 0.06;
