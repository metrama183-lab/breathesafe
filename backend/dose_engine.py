"""
BreatheSafe Dose Engine
=======================
Calculates personal inhaled PM2.5 dose based on activities and microenvironments.

Scientific references:
- Breathing rates: US EPA Exposure Factors Handbook, Chapter 6
- Indoor infiltration: I/O ratio studies (0.5-0.6 with windows closed)
- Cooking emissions: Lawrence Berkeley National Lab, Stanford gas stove studies
- Vehicle cabin: PM2.5 cabin filtration studies (recirculation mode)
- Cigarette equivalence: Berkeley Earth (2015), Pope et al. (2016)
- Health impact: WHO AirQ+, AQLI (University of Chicago)
"""

from models import ActivityType, ActivityEntry, DoseResult, HealthImpact

# --- BREATHING RATES (m³/hour) ---
# Source: US EPA Exposure Factors Handbook, Chapter 6
BREATHING_RATES: dict[ActivityType, float] = {
    ActivityType.SLEEPING: 0.3,
    ActivityType.RESTING: 0.5,
    ActivityType.WALKING: 1.5,
    ActivityType.CYCLING: 2.5,
    ActivityType.RUNNING: 3.2,
    ActivityType.DRIVING: 0.5,
    ActivityType.PUBLIC_TRANSPORT: 0.5,
    ActivityType.COOKING_GAS: 0.5,
    ActivityType.COOKING_ELECTRIC: 0.5,
    ActivityType.COOKING_GAS_HOOD: 0.5,
    ActivityType.COOKING_ELECTRIC_HOOD: 0.5,
    ActivityType.OFFICE: 0.5,
}

# --- PM2.5 MICROENVIRONMENT MODIFIERS ---
# Each activity has: (outdoor_multiplier, indoor_additive_ug_m3)
# Final PM2.5 = outdoor_pm25 * multiplier + additive
MICROENVIRONMENT: dict[ActivityType, tuple[float, float]] = {
    ActivityType.SLEEPING:             (0.5, 0.0),    # Indoor, windows closed
    ActivityType.RESTING:              (0.5, 0.0),    # Indoor baseline
    ActivityType.WALKING:              (1.0, 0.0),    # Full outdoor exposure
    ActivityType.CYCLING:              (1.0, 0.0),    # Full outdoor exposure
    ActivityType.RUNNING:              (1.0, 0.0),    # Full outdoor exposure
    ActivityType.DRIVING:              (0.3, 0.0),    # Car, windows closed, recirculation
    ActivityType.PUBLIC_TRANSPORT:     (0.8, 0.0),    # Bus/tram, frequent door openings
    ActivityType.COOKING_GAS:          (0.5, 200.0),  # Indoor base + gas combustion byproducts
    ActivityType.COOKING_ELECTRIC:     (0.5, 80.0),   # Indoor base + food aerosol only
    ActivityType.COOKING_GAS_HOOD:     (0.5, 60.0),   # Gas + hood captures ~70%
    ActivityType.COOKING_ELECTRIC_HOOD:(0.5, 24.0),   # Electric + hood captures ~70%
    ActivityType.OFFICE:               (0.5, 0.0),    # Indoor, commercial HVAC
}

# Berkeley Earth constant: 22 µg/m³ annual average = 1 cigarette/day
CIGARETTE_CONSTANT = 22.0

# WHO PM2.5 guideline (annual mean)
WHO_PM25_LIMIT = 5.0

# AQLI: ~0.98 years of life lost per 10 µg/m³ over lifetime
# Annualized approximation for display
HOURS_LOST_PER_UG_ANNUAL = 1.15  # hours/year per µg/m³ above WHO limit

# Pope et al. 2002/2016: RR ≈ 1.06 per 10 µg/m³ increase
RELATIVE_RISK_PER_10UG = 0.06


def calculate_activity_dose(
    activity: ActivityEntry,
    outdoor_pm25: float,
) -> dict:
    """Calculate inhaled PM2.5 dose for a single activity segment."""
    multiplier, additive = MICROENVIRONMENT[activity.activity_type]

    if activity.is_outdoor:
        effective_pm25 = outdoor_pm25
    else:
        effective_pm25 = outdoor_pm25 * multiplier + additive

    breathing_rate = BREATHING_RATES[activity.activity_type]
    dose_ug = effective_pm25 * breathing_rate * activity.duration_hours
    cigarettes = (effective_pm25 / CIGARETTE_CONSTANT) * (activity.duration_hours / 24.0)

    return {
        "activity": activity.activity_type.value,
        "duration_hours": activity.duration_hours,
        "effective_pm25": round(effective_pm25, 1),
        "breathing_rate": breathing_rate,
        "dose_ug": round(dose_ug, 1),
        "cigarettes": round(cigarettes, 3),
    }


def calculate_daily_dose(
    activities: list[ActivityEntry],
    outdoor_pm25: float,
) -> DoseResult:
    """Calculate total daily inhaled dose across all activities."""
    breakdown = []
    total_dose = 0.0
    total_cigarettes = 0.0
    total_hours = 0.0
    weighted_pm25_sum = 0.0

    for activity in activities:
        result = calculate_activity_dose(activity, outdoor_pm25)
        breakdown.append(result)
        total_dose += result["dose_ug"]
        total_cigarettes += result["cigarettes"]
        total_hours += activity.duration_hours
        weighted_pm25_sum += result["effective_pm25"] * activity.duration_hours

    weighted_avg_pm25 = weighted_pm25_sum / max(total_hours, 1.0)

    recommendations = _generate_recommendations(breakdown, outdoor_pm25)

    return DoseResult(
        total_dose_ug=round(total_dose, 1),
        cigarettes_equivalent=round(total_cigarettes, 2),
        breakdown=breakdown,
        pm25_outdoor=outdoor_pm25,
        recommendations=recommendations,
    )


def calculate_health_impact(
    annual_avg_pm25: float,
    cigarettes_per_day: float,
) -> HealthImpact:
    """Calculate long-term health impact based on WHO/AQLI methodology."""
    who_ratio = annual_avg_pm25 / WHO_PM25_LIMIT
    excess = max(0, annual_avg_pm25 - WHO_PM25_LIMIT)
    hours_lost = excess * HOURS_LOST_PER_UG_ANNUAL
    risk_increase = (annual_avg_pm25 / 10.0) * RELATIVE_RISK_PER_10UG * 100

    return HealthImpact(
        annual_cigarettes=round(cigarettes_per_day * 365, 0),
        who_limit_ratio=round(who_ratio, 1),
        estimated_hours_lost_per_year=round(hours_lost, 1),
        respiratory_risk_increase_pct=round(risk_increase, 1),
        sources=[
            "Berkeley Earth (2015) - Cigarette equivalence formula",
            "Pope et al. (2002, 2016) - Long-term PM2.5 mortality cohort studies",
            "WHO AirQ+ - Health impact assessment methodology",
            "AQLI, University of Chicago - Life expectancy impact per µg/m³",
            "US EPA Exposure Factors Handbook - Inhalation rates",
        ],
    )


def _generate_recommendations(
    breakdown: list[dict],
    outdoor_pm25: float,
) -> list[str]:
    """Generate actionable recommendations based on the dose breakdown."""
    recs = []

    sorted_activities = sorted(breakdown, key=lambda x: x["dose_ug"], reverse=True)
    top = sorted_activities[0] if sorted_activities else None

    if top and top["activity"] in ("cooking_gas", "cooking_electric"):
        saved_cig = top["cigarettes"] * 0.70
        saved_ug = top["dose_ug"] * 0.70
        recs.append(
            f"Turn on the range hood when cooking: save ~{saved_ug:.0f} µg "
            f"({saved_cig:.2f} cigarettes)"
        )

    if top and top["activity"] == "cooking_gas":
        recs.append(
            "Gas stoves emit NO₂ and benzene beyond PM2.5. "
            "Consider switching to electric/induction for cleaner indoor air."
        )

    cycling_entries = [a for a in breakdown if a["activity"] == "cycling"]
    for c in cycling_entries:
        if outdoor_pm25 > 25:
            metro_dose = outdoor_pm25 * 0.8 * 0.5 * c["duration_hours"]
            saved_ug = c["dose_ug"] - metro_dose
            recs.append(
                f"High pollution today ({outdoor_pm25:.0f} µg/m³). "
                f"Taking public transport instead of cycling would save ~{saved_ug:.0f} µg"
            )

    running_entries = [a for a in breakdown if a["activity"] == "running"]
    for r in running_entries:
        if outdoor_pm25 > 20:
            recs.append(
                "Consider exercising early morning (6-7 AM) when PM2.5 is typically "
                "30-40% lower, or find an indoor alternative on high-pollution days."
            )

    if outdoor_pm25 > WHO_PM25_LIMIT * 3:
        recs.append(
            f"Air quality is {outdoor_pm25 / WHO_PM25_LIMIT:.0f}x the WHO limit. "
            "Keep windows closed and minimize outdoor time."
        )

    if outdoor_pm25 < 15:
        recs.append(
            "Air quality is relatively good today. Great time for outdoor exercise "
            "and ventilating your home."
        )

    if not recs:
        recs.append("Your exposure is moderate. Keep tracking to find patterns!")

    return recs
