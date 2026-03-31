"""
BreatheSafe API Server
======================
FastAPI backend handling dose calculations, air quality data caching,
and health impact assessments.
"""

import os
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from models import DayLog, DoseResult, HealthImpact, CityComparison, AirQualityData
from dose_engine import calculate_daily_dose, calculate_health_impact, CIGARETTE_CONSTANT, FALLBACK_PM25
from openaq_worker import fetch_nearest_pm25, fetch_all_cities, get_fallback_pm25, DEFAULT_CITIES

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory cache for air quality data (replaced by Supabase in production)
air_cache: dict[str, dict] = {}
last_cache_update: datetime | None = None

scheduler = AsyncIOScheduler()


async def refresh_air_cache():
    """Background job: fetch air quality for all cities and update cache."""
    global air_cache, last_cache_update
    logger.info("Refreshing air quality cache...")

    api_key = os.getenv("OPENAQ_API_KEY")
    results = await fetch_all_cities(api_key)

    for r in results:
        city_key = r.get("default_city", "").lower()
        if city_key:
            air_cache[city_key] = r

    last_cache_update = datetime.now(timezone.utc)
    logger.info(f"Cache updated with {len(results)} cities at {last_cache_update}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await refresh_air_cache()
    scheduler.add_job(refresh_air_cache, "interval", minutes=20)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="BreatheSafe API",
    description="Personal air pollution dose tracker",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": "BreatheSafe API",
        "version": "1.0.0",
        "cache_cities": len(air_cache),
        "last_update": last_cache_update.isoformat() if last_cache_update else None,
    }


@app.get("/air/city/{city}", response_model=AirQualityData)
async def get_city_air_quality(city: str):
    """Get current air quality for a cached city."""
    city_lower = city.lower()

    if city_lower in air_cache:
        data = air_cache[city_lower]
        return AirQualityData(
            city=data.get("default_city", city),
            country=data.get("country", ""),
            pm25=data.get("pm25", 15.0),
            timestamp=data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            station_name=data.get("station"),
            latitude=data.get("lat"),
            longitude=data.get("lon"),
        )

    # Try a few matching strategies
    for key, data in air_cache.items():
        if city_lower in key or key in city_lower:
            return AirQualityData(
                city=data.get("default_city", city),
                country=data.get("country", ""),
                pm25=data.get("pm25", 15.0),
                timestamp=data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                station_name=data.get("station"),
                latitude=data.get("lat"),
                longitude=data.get("lon"),
            )

    fallback = get_fallback_pm25(city)
    return AirQualityData(
        city=city,
        country="",
        pm25=fallback,
        timestamp=datetime.now(timezone.utc).isoformat(),
        station_name="estimated",
    )


@app.get("/air/location")
async def get_location_air_quality(lat: float, lon: float):
    """Get air quality for an arbitrary lat/lon (direct OpenAQ call with cache)."""
    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"

    if cache_key in air_cache:
        cached = air_cache[cache_key]
        return cached

    api_key = os.getenv("OPENAQ_API_KEY")
    data = await fetch_nearest_pm25(lat, lon, api_key)

    if data:
        air_cache[cache_key] = data
        return data

    return {
        "pm25": 15.0,
        "station": "global_average_fallback",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "is_fallback": True,
    }


@app.post("/dose/calculate", response_model=DoseResult)
async def calculate_dose(day_log: DayLog):
    """Calculate personal inhaled dose for a day's activities."""
    city_lower = day_log.city.lower()

    pm25 = None
    if city_lower in air_cache:
        pm25 = air_cache[city_lower].get("pm25")
    else:
        for key, data in air_cache.items():
            if city_lower in key or key in city_lower:
                pm25 = data.get("pm25")
                break

    if pm25 is None:
        if day_log.latitude and day_log.longitude:
            api_key = os.getenv("OPENAQ_API_KEY")
            result = await fetch_nearest_pm25(
                day_log.latitude, day_log.longitude, api_key
            )
            if result:
                pm25 = result.get("pm25", 15.0)

    if pm25 is None:
        pm25 = get_fallback_pm25(day_log.city)

    return calculate_daily_dose(day_log.activities, pm25)


@app.get("/health/impact")
async def get_health_impact(city: str, cigarettes_per_day: float):
    """Calculate long-term health impact for a user."""
    city_lower = city.lower()
    pm25 = None

    if city_lower in air_cache:
        pm25 = air_cache[city_lower].get("pm25")

    if pm25 is None:
        pm25 = get_fallback_pm25(city)

    return calculate_health_impact(pm25, cigarettes_per_day)


@app.get("/compare/cities", response_model=list[CityComparison])
async def compare_cities():
    """Return PM2.5 and cigarette equivalents for all cached cities."""
    comparisons = []

    all_cities = {}
    for key, data in air_cache.items():
        city_name = data.get("default_city", key)
        pm25 = data.get("pm25", 15.0)
        all_cities[city_name] = pm25

    for name, pm25 in FALLBACK_PM25.items():
        if name not in all_cities:
            all_cities[name] = pm25

    for city_name, pm25 in sorted(all_cities.items(), key=lambda x: x[1]):
        cig_day = pm25 / CIGARETTE_CONSTANT
        comparisons.append(CityComparison(
            city=city_name,
            pm25_avg=round(pm25, 1),
            cigarettes_per_day=round(cig_day, 2),
            annual_cigarettes=round(cig_day * 365, 0),
        ))

    return comparisons


@app.get("/cities")
async def list_cities():
    """List all supported cities."""
    return [c["city"] for c in DEFAULT_CITIES]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
