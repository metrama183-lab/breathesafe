# BreatheSafe 🫁

**The first personal air pollution dose tracker.**

> 99% of humanity breathes unsafe air (WHO). 7 million people die every year from air pollution. But nobody knows how much pollution is actually entering *their* lungs.

BreatheSafe changes this. It calculates your **real inhaled dose** based on what you do, where you are, and how hard you breathe — then translates it into something everyone understands: **cigarettes**.

## The Problem

Existing air quality apps show abstract numbers (AQI, µg/m³) that nobody understands. They tell you the air is bad, but not:
- How much pollution is entering **your** lungs specifically
- How your daily **activities** change your exposure (cycling vs driving, cooking vs sleeping)
- What the **indoor** air you breathe is doing to you (cooking on gas = up to 400 µg/m³)
- What the **long-term health cost** is in terms you understand

## The Solution

BreatheSafe combines **real-time air quality data** with **your daily activities** to calculate your personal inhaled PM2.5 dose, using peer-reviewed science:

### Core Formula
```
Dose (µg) = Σ [PM2.5_environment × breathing_rate × duration]
Cigarettes/day = weighted_average_PM2.5 / 22
```

### What Makes It Unique
1. **Activity-aware dosimetry** — Cycling inhales 5x more than driving the same route
2. **Indoor pollution tracking** — Cooking on gas adds 200 µg/m³ (a hidden killer)
3. **Cumulative exposure history** — Not just today, but your total over weeks/months/years
4. **Health impact in human terms** — Hours of life lost, respiratory risk %, not abstract numbers
5. **Google Health Connect integration** — Auto-detects walking, cycling, running, sleep
6. **Actionable recommendations** — "Run at 6 AM, not 8 AM: save 0.4 cigarettes"

## Scientific Foundation

Every number in BreatheSafe is backed by peer-reviewed research:

| Parameter | Source |
|-----------|--------|
| Breathing rates by activity | US EPA Exposure Factors Handbook, Ch. 6 |
| Indoor infiltration (I/O ratio) | Systematic literature review, PM2.5 I/O studies |
| Cooking emissions (gas vs electric) | Stanford gas stove study, Lawrence Berkeley National Lab |
| Vehicle cabin filtration | PM2.5 cabin air filtration studies (HVAC recirculation) |
| Cigarette equivalence (22 µg/m³) | Berkeley Earth (2015), Pope et al. (2016) |
| Health impact (life years lost) | WHO AirQ+, AQLI University of Chicago |

## Tech Stack

- **Mobile App**: Expo (React Native) + TypeScript
- **Backend**: Python FastAPI
- **State**: Zustand + AsyncStorage
- **Air Quality Data**: OpenAQ API (real-time, global) + Copernicus CAMS (forecasts)
- **Health Data**: Google Health Connect (Android)
- **Science**: Berkeley Earth formula, WHO AirQ+ methodology, EPA breathing rates

## Architecture

```
Mobile App (Expo)              Backend (FastAPI)
├── Home (dose gauge)          ├── Dose Engine (science)
├── Activity logger            ├── OpenAQ worker (cron cache)
├── History (charts)           ├── Health calculator (WHO)
├── Health impact (WHO)        └── City comparison API
├── City comparison
└── Health Connect sync
         │                              │
         └──── Supabase (PostgreSQL) ───┘
```

## Screens

1. **Now** — Your cigarette equivalent today, with per-activity dose breakdown
2. **Day** — Activity logger with templates (one-tap "Workday" or "Weekend")
3. **History** — Daily bar chart + 28-day heatmap of cumulative exposure
4. **Health** — WHO limit comparison, life expectancy impact, respiratory risk
5. **Compare** — Your city ranked against 16 world cities

## Getting Started

### Mobile App
```bash
cd breathesafe
npm install
npx expo start
```

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

## Environmental Impact

Air pollution is the **#1 environmental health risk** worldwide:
- **7 million** premature deaths per year (WHO)
- **99%** of people breathe air exceeding WHO guidelines
- Only **14%** of cities meet safe air quality standards (IQAir 2025)

BreatheSafe empowers individuals to understand and reduce their exposure through data-driven decisions — choosing when to exercise, how to commute, and how to cook in ways that dramatically cut their inhaled pollution dose.

## EcoHacks 2026

Built for [EcoHacks](https://ecohackers.devpost.com/) — an environmental STEM hackathon by Green Spaces Initiative.

## License

MIT
