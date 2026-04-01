from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class ActivityType(str, Enum):
    SLEEPING = "sleeping"
    RESTING = "resting"
    WALKING = "walking"
    CYCLING = "cycling"
    RUNNING = "running"
    DRIVING = "driving"
    PUBLIC_TRANSPORT = "public_transport"
    COOKING_GAS = "cooking_gas"
    COOKING_ELECTRIC = "cooking_electric"
    COOKING_GAS_HOOD = "cooking_gas_hood"
    COOKING_ELECTRIC_HOOD = "cooking_electric_hood"
    OFFICE = "office"


class ActivityEntry(BaseModel):
    activity_type: ActivityType
    duration_hours: float = Field(ge=0, le=24)
    is_outdoor: bool = False


class DayLog(BaseModel):
    city: str
    country_code: str
    activities: list[ActivityEntry]
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DoseResult(BaseModel):
    total_dose_ug: float
    cigarettes_equivalent: float
    breakdown: list[dict]
    pm25_outdoor: float
    recommendations: list[str]


class AirQualityData(BaseModel):
    city: str
    country: str
    pm25: float
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    timestamp: str
    station_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CityComparison(BaseModel):
    city: str
    pm25_avg: float
    cigarettes_per_day: float
    annual_cigarettes: float


class HealthImpact(BaseModel):
    annual_cigarettes: float
    who_limit_ratio: float
    estimated_hours_lost_per_year: float
    respiratory_risk_increase_pct: float
    sources: list[str]
