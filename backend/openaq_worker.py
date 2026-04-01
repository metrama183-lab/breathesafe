"""
OpenAQ Background Worker
=========================
Periodically fetches PM2.5 data from OpenAQ API and caches it locally.
Avoids rate limiting (60 req/min, 2000 req/hr) by batching requests.
"""

import httpx
import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

OPENAQ_BASE = "https://api.openaq.org/v3"

# Major cities to pre-cache for fast responses
DEFAULT_CITIES = [
    {"city": "Milano", "country": "IT", "lat": 45.4642, "lon": 9.1900},
    {"city": "Roma", "country": "IT", "lat": 41.9028, "lon": 12.4964},
    {"city": "Torino", "country": "IT", "lat": 45.0703, "lon": 7.6869},
    {"city": "Napoli", "country": "IT", "lat": 40.8518, "lon": 14.2681},
    {"city": "Bologna", "country": "IT", "lat": 44.4949, "lon": 11.3426},
    {"city": "Firenze", "country": "IT", "lat": 43.7696, "lon": 11.2558},
    {"city": "London", "country": "GB", "lat": 51.5074, "lon": -0.1278},
    {"city": "Paris", "country": "FR", "lat": 48.8566, "lon": 2.3522},
    {"city": "Berlin", "country": "DE", "lat": 52.5200, "lon": 13.4050},
    {"city": "Madrid", "country": "ES", "lat": 40.4168, "lon": -3.7038},
    {"city": "Barcelona", "country": "ES", "lat": 41.3874, "lon": 2.1686},
    {"city": "Amsterdam", "country": "NL", "lat": 52.3676, "lon": 4.9041},
    {"city": "Stockholm", "country": "SE", "lat": 59.3293, "lon": 18.0686},
    {"city": "Wien", "country": "AT", "lat": 48.2082, "lon": 16.3738},
    {"city": "Zürich", "country": "CH", "lat": 47.3769, "lon": 8.5417},
    {"city": "Bruxelles", "country": "BE", "lat": 50.8503, "lon": 4.3517},
    {"city": "Lisboa", "country": "PT", "lat": 38.7223, "lon": -9.1393},
    {"city": "Warszawa", "country": "PL", "lat": 52.2297, "lon": 21.0122},
    {"city": "Praha", "country": "CZ", "lat": 50.0755, "lon": 14.4378},
    {"city": "Budapest", "country": "HU", "lat": 47.4979, "lon": 19.0402},
    {"city": "New Delhi", "country": "IN", "lat": 28.6139, "lon": 77.2090},
    {"city": "Beijing", "country": "CN", "lat": 39.9042, "lon": 116.4074},
    {"city": "Tokyo", "country": "JP", "lat": 35.6762, "lon": 139.6503},
    {"city": "New York", "country": "US", "lat": 40.7128, "lon": -74.0060},
    {"city": "Los Angeles", "country": "US", "lat": 34.0522, "lon": -118.2437},
    {"city": "São Paulo", "country": "BR", "lat": -23.5505, "lon": -46.6333},
]

# Fallback values when API is unavailable (annual averages, WHO/IQAir 2024-2025)
FALLBACK_PM25: dict[str, float] = {
    "Milano": 25.0,
    "Roma": 16.0,
    "Torino": 28.0,
    "Napoli": 18.0,
    "Bologna": 22.0,
    "Firenze": 15.0,
    "London": 11.0,
    "Paris": 14.0,
    "Berlin": 12.0,
    "Madrid": 10.0,
    "Barcelona": 13.0,
    "Amsterdam": 11.0,
    "Stockholm": 6.0,
    "Wien": 13.0,
    "Zürich": 10.0,
    "Bruxelles": 12.0,
    "Lisboa": 9.0,
    "Warszawa": 21.0,
    "Praha": 17.0,
    "Budapest": 19.0,
    "New Delhi": 99.0,
    "Beijing": 42.0,
    "Tokyo": 12.0,
    "New York": 10.0,
    "Los Angeles": 14.0,
    "São Paulo": 17.0,
}


async def fetch_nearest_pm25(
    lat: float,
    lon: float,
    api_key: str | None = None,
) -> dict | None:
    """Fetch the nearest PM2.5 measurement from OpenAQ for a given coordinate."""
    headers = {}
    if api_key:
        headers["X-API-Key"] = api_key

    params = {
        "coordinates": f"{lat},{lon}",
        "radius": 50000,  # 50km radius
        "parameter_id": 2,  # PM2.5
        "limit": 5,
        "order_by": "distance",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{OPENAQ_BASE}/locations",
                params=params,
                headers=headers,
            )

            if resp.status_code == 429:
                logger.warning("OpenAQ rate limit hit, using fallback data")
                return None

            if resp.status_code != 200:
                logger.error(f"OpenAQ returned {resp.status_code}: {resp.text[:200]}")
                return None

            data = resp.json()
            results = data.get("results", [])

            for location in results:
                sensors = location.get("sensors", [])
                for sensor in sensors:
                    param = sensor.get("parameter", {})
                    if param.get("name") == "pm25" or param.get("id") == 2:
                        latest = sensor.get("latest", {})
                        pm25_val = latest.get("value")
                        if pm25_val is None or pm25_val <= 0:
                            continue
                        return {
                            "pm25": pm25_val,
                            "station": location.get("name", "Unknown"),
                            "city": location.get("locality") or location.get("name"),
                            "country": location.get("country", {}).get("code", ""),
                            "lat": location.get("coordinates", {}).get("latitude"),
                            "lon": location.get("coordinates", {}).get("longitude"),
                            "timestamp": latest.get("datetime", {}).get("utc", ""),
                            "distance_m": location.get("distance"),
                        }

    except httpx.TimeoutException:
        logger.error("OpenAQ request timed out")
    except Exception as e:
        logger.error(f"OpenAQ fetch error: {e}")

    return None


async def fetch_all_cities(api_key: str | None = None) -> list[dict]:
    """Fetch PM2.5 for all default cities. Used by the background worker."""
    results = []

    for city_info in DEFAULT_CITIES:
        data = await fetch_nearest_pm25(
            city_info["lat"],
            city_info["lon"],
            api_key,
        )

        if data:
            data["default_city"] = city_info["city"]
            results.append(data)
        else:
            results.append({
                "default_city": city_info["city"],
                "pm25": FALLBACK_PM25.get(city_info["city"], 15.0),
                "station": "fallback",
                "country": city_info["country"],
                "lat": city_info["lat"],
                "lon": city_info["lon"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "is_fallback": True,
            })

        await asyncio.sleep(1.2)  # Stay well under 60 req/min

    return results


def get_fallback_pm25(city: str) -> float:
    """Get fallback PM2.5 value for a city when API is unavailable."""
    for name, val in FALLBACK_PM25.items():
        if name.lower() in city.lower() or city.lower() in name.lower():
            return val
    return 15.0  # Global average fallback
