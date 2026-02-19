"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./Dashboard.module.css";

const DEFAULT_CITY = "Karachi";
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
const WEATHER_API_URL = "https://api.weatherapi.com/v1/current.json";
const WEATHER_REFRESH_MS = 5 * 60 * 1000;
const FUEL_REFRESH_MS = 10 * 60 * 1000;

const Dashboard = () => {
  /* =======================
     TOP UI STATE
  ======================== */
  const [topSearch, setTopSearch] = useState("");

  /* =======================
     ENGINE STATE
  ======================== */
  const [engineOn, setEngineOn] = useState(false);

  /* =======================
     WEATHER STATE
  ======================== */
  const [city, setCity] = useState(DEFAULT_CITY);
  const [locationLabel, setLocationLabel] = useState("Searching...");
  const [weather, setWeather] = useState({
    temp_c: null,
    condition: { text: "", icon: "" },
    isDay: null,
  });
  const [loading, setLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState("");
  const weatherAbortRef = useRef(null);

  /* =======================
     TIME STATE
  ======================== */
  const [date, setDate] = useState(new Date());
  const [timeString, setTimeString] = useState("");

  /* =======================
     FUEL STATE
  ======================== */
  const [fuel, setFuel] = useState({
    petrol: null,
    diesel: null,
    updatedAt: null,
  });
  const [fuelLoading, setFuelLoading] = useState(false);
  const [fuelError, setFuelError] = useState(null);

  /* =======================
     HELPERS
  ======================== */
  const determineTimeOfDay = useCallback((localTimeStr) => {
    if (!localTimeStr) return "";
    const hour = parseInt(localTimeStr.split(" ")[1].split(":")[0], 10);
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 18) return "Evening";
    return "Night";
  }, []);

  const getCustomWeatherIcon = useCallback((conditionText, isDay) => {
    if (!conditionText) return "/Weather/Default.png";
    const condition = conditionText.toLowerCase();
    const isDayTime = isDay === true;

    if (condition.includes("sunny")) {
      return isDayTime ? "/Weather/MostlySunny.png" : "/Weather/Partly-Cloudy-(Night).png";
    }
    if (condition.includes("clear")) {
      return isDayTime ? "/Weather/MostlySunny.png" : "/Weather/Partly-Cloudy-(Night).png";
    }
    if (condition.includes("partly cloudy")) {
      return isDayTime ? "/Weather/PartlyCloudy(Day).png" : "/Weather/Partly-Cloudy-(Night).png";
    }

    if (
      condition.includes("rain") ||
      condition.includes("drizzle") ||
      condition.includes("shower") ||
      condition.includes("showers")
    ) {
      return "/Weather/Rainy.png";
    }

    if (condition.includes("thunder")) return "/Weather/Thunderstorm.png";

    if (
      condition.includes("snow") ||
      condition.includes("sleet") ||
      condition.includes("blizzard") ||
      condition.includes("ice")
    ) {
      return "/Weather/Default.png";
    }

    if (condition.includes("overcast")) {
      return "/Weather/Partly-Cloudy-with-Rain.png";
    }

    if (
      condition.includes("mist") ||
      condition.includes("fog") ||
      condition.includes("haze") ||
      condition.includes("smoke") ||
      condition.includes("dust") ||
      condition.includes("sand")
    ) {
      return "/Weather/Default.png";
    }

    return "/Weather/Default.png";
  }, []);

  const displayCondition = useCallback((text) => {
    if (!text) return "Loading...";
    if (text.toLowerCase().includes("mist")) return "Partly Cloudy (Day)";
    return text;
  }, []);

  /* =======================
     WEATHER FETCH
  ======================== */
  const fetchWeather = useCallback(
    async (query) => {
      if (!query || query.trim() === "") return;
      if (!WEATHER_API_KEY) {
        setWeatherError("Weather API key is missing.");
        return;
      }

      if (weatherAbortRef.current) {
        weatherAbortRef.current.abort();
      }

      const controller = new AbortController();
      weatherAbortRef.current = controller;

      setLoading(true);
      setWeatherError(null);

      try {
        const res = await fetch(
          `${WEATHER_API_URL}?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
            query
          )}&aqi=no`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Failed to fetch weather data");

        const data = await res.json();
        setWeather({
          temp_c: data.current.temp_c,
          condition: data.current.condition,
          isDay: data.current.is_day === 1,
        });
        setLocationLabel(`${data.location.name}, ${data.location.country}`);
        setTimeOfDay(determineTimeOfDay(data.location.localtime));
      } catch (err) {
        if (err.name !== "AbortError") {
          setWeatherError("Please enter a valid city name");
          setTimeOfDay("");
        }
      } finally {
        setLoading(false);
      }
    },
    [determineTimeOfDay]
  );

  const handleWeatherSearch = () => {
    if (city.trim()) fetchWeather(city.trim());
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeather(`${latitude},${longitude}`);
        },
        () => {
          fetchWeather(DEFAULT_CITY);
        }
      );
    } else {
      fetchWeather(DEFAULT_CITY);
    }
  }, [fetchWeather]);

  useEffect(() => {
    const interval = setInterval(() => fetchWeather(city), WEATHER_REFRESH_MS);
    return () => clearInterval(interval);
  }, [city, fetchWeather]);

  /* =======================
     TIME TICKER (Karachi)
  ======================== */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const formatterForDate = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Karachi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const parts = formatterForDate.formatToParts(now);
      const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
      const dateString = `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
      setDate(new Date(dateString));

      const formatterForDisplay = new Intl.DateTimeFormat("en-PK", {
        timeZone: "Asia/Karachi",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setTimeString(formatterForDisplay.format(now));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = date.getSeconds();
  const minutes = date.getMinutes();
  const hours = date.getHours() % 12;
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = (minutes / 60) * 360;
  const hourAngle = (hours / 12) * 360 + (minutes / 60) * 30;

  /* =======================
     FUEL FETCH
  ======================== */
  const fetchFuelRate = useCallback(async () => {
    setFuelLoading(true);
    setFuelError(null);

    try {
      const res = await fetch(`/api/fuel`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Fuel API failed");

      const data = await res.json();

      setFuel({
        petrol:
          data?.petrol ??
          data?.Petrol ??
          data?.petrolrate ??
          data?.petrolRate ??
          null,
        diesel:
          data?.diesel ??
          data?.Diesel ??
          data?.dieselrate ??
          data?.dieselRate ??
          null,
        updatedAt: data?.updatedAt ?? data?.lastupdated ?? data?.lastUpdated ?? null,
      });
    } catch (e) {
      setFuelError("Fuel rates load nahi ho rahe.");
    } finally {
      setFuelLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFuelRate();
    const t = setInterval(fetchFuelRate, FUEL_REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchFuelRate]);

  return (
    <div className={styles.page}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <div className={styles.topSearchWrap}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                stroke="#777"
                strokeWidth="2"
              />
              <path
                d="M16.5 16.5 21 21"
                stroke="#777"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            className={styles.topSearch}
            type="search"
            placeholder="Search"
            value={topSearch}
            onChange={(e) => setTopSearch(e.target.value)}
            aria-label="Search dashboard"
          />
        </div>

        <div className={styles.topActions}>
          <button className={styles.iconBtn} aria-label="Favorite">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3.5 14.7 9l6 .6-4.6 3.9 1.4 5.8-5.5-3.2-5.5 3.2 1.4-5.8L3.3 9.6l6-.6L12 3.5Z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button className={styles.iconBtn} aria-label="Filter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button className={styles.iconBtn} aria-label="Grid">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className={styles.dashboard}>
        {/* WEATHER */}
        <div className={`${styles.card} ${styles.weather}`}>
          <div className={styles.weatherTopRow}>
            <input
              className={styles.weatherInput}
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleWeatherSearch();
              }}
              disabled={loading}
              aria-label="Search weather by city"
            />

            <div className={styles.weatherRight}>
              <div className={styles.weatherTitle}>
                <Image
                  src={
                    weather?.condition?.text && !loading
                      ? getCustomWeatherIcon(weather.condition.text, weather.isDay)
                      : "/Weather/Default.png"
                  }
                  alt=""
                  width={14}
                  height={14}
                  unoptimized
                />
                <span>Weather</span>
              </div>

              <div className={styles.weatherCondition}>
                {loading
                  ? "Loading..."
                  : weather?.condition?.text
                  ? displayCondition(weather.condition.text)
                  : "Loading..."}
              </div>
            </div>
          </div>

          <div className={styles.weatherMain}>
            <div className={styles.weatherTemp}>
              {loading
                ? "Loading..."
                : weather.temp_c !== null
                ? `${weather.temp_c}\u00b0`
                : "--"}
            </div>

            <div className={styles.weatherMeta}>
              <div className={styles.weatherLoc}>
                {locationLabel} {timeOfDay ? `- ${timeOfDay}` : ""}
              </div>
            </div>

            {weatherError && (
              <div className={styles.weatherError} role="alert" aria-live="polite">
                {weatherError}
              </div>
            )}
          </div>
        </div>

        {/* ENGINE */}
        <div className={`${styles.card} ${styles.engine}`}>
          <div className={styles.engineLeft}>
            <div className={styles.engineTitle}>Engine</div>
            <div className={styles.engineSub}>Switch</div>
          </div>

          <label className={styles.engineToggle} aria-label="Engine switch">
            <input
              type="checkbox"
              checked={engineOn}
              onChange={() => setEngineOn((v) => !v)}
            />
            <span className={styles.engineTrack}>
              <span className={styles.engineKnob}>{engineOn ? "ON" : "OFF"}</span>
            </span>
          </label>
        </div>

        {/* TIME */}
        <div className={`${styles.card} ${styles.timeCard}`}>
          <div className={styles.timeLeft}>
            <div className={styles.timeTitle}>Time</div>
            <div className={styles.timeDate}>{date.toLocaleDateString("en-PK")}</div>
            <div className={styles.timeDate}>{timeString}</div>
          </div>

          <div className={styles.clockWrap} aria-label="Analog clock">
            <svg viewBox="0 0 512 512" className={styles.clockSvg}>
              <circle cx="256" cy="256" r="245" className={styles.clockCircle} />
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = i * 6 * (Math.PI / 180);
                const isHour = i % 5 === 0;
                const length = isHour ? 20 : 10;
                const strokeWidth = isHour ? 6 : 2;
                const x1 = 256 + Math.cos(angle) * (200 - length);
                const y1 = 256 + Math.sin(angle) * (200 - length);
                const x2 = 256 + Math.cos(angle) * 200;
                const y2 = 256 + Math.sin(angle) * 200;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={styles.clockTick}
                    strokeWidth={strokeWidth}
                  />
                );
              })}

              <line
                x1="256"
                y1="256"
                x2="256"
                y2="160"
                className={styles.hourHand}
                style={{ transformOrigin: "256px 256px", transform: `rotate(${hourAngle}deg)` }}
              />
              <line
                x1="256"
                y1="256"
                x2="256"
                y2="110"
                className={styles.minuteHand}
                style={{ transformOrigin: "256px 256px", transform: `rotate(${minuteAngle}deg)` }}
              />
              <line
                x1="256"
                y1="256"
                x2="256"
                y2="85"
                className={styles.secondHand}
                style={{ transformOrigin: "256px 256px", transform: `rotate(${secondAngle}deg)` }}
              />
              <circle cx="256" cy="256" r="6" fill="#d53e3e" />
            </svg>
          </div>
        </div>

        {/* SAVING (static display, same as design) */}
        <div className={`${styles.card} ${styles.saving}`}>
          <div className={styles.savingTop}>
            <div className={styles.savingAmount}>$1250</div>
            <div className={styles.savingSub}>Your total saving so far</div>
          </div>

          <div className={styles.savingChart}>
            <div className={styles.tooltip} style={{ left: "73%" }}>
              $1250
            </div>

            <svg
              viewBox="0 0 420 180"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              className={styles.savingSvg}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3f57ff" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#3f57ff" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d="
          M 0 95
          C 10 88, 22 84, 34 74
          C 46 84, 58 66, 70 82
          C 82 90, 96 68, 110 80
          C 124 96, 138 88, 154 72
          C 170 84, 182 98, 194 82
          C 206 70, 220 86, 236 94
          C 252 102, 268 82, 282 64
          C 296 74, 306 86, 315 92
          C 340 82, 365 84, 390 86
          C 402 88, 412 90, 420 90
          L 420 180
          L 0 180 Z
        "
                fill="url(#areaGrad)"
                stroke="#3f57ff"
                strokeWidth="3"
              />

              <line
                x1="315"
                y1="24"
                x2="315"
                y2="180"
                stroke="#3f57ff"
                strokeWidth="2"
              />

              <circle
                cx="315"
                cy="92"
                r="6"
                fill="#fff"
                stroke="#3f57ff"
                strokeWidth="3"
              />
            </svg>

            <div className={styles.savingAxis}>
              <span>$5K</span>
              <span>$3K</span>
              <span>$1K</span>
            </div>

            <div className={styles.savingMonths}>
              <span>Jan</span>
              <span>Mar</span>
              <span>May</span>
            </div>
          </div>

          <button className={styles.detailsBtn}>Details</button>
        </div>

        {/* DONUT */}
        <div className={`${styles.card} ${styles.donutCard}`}>
          <div className={styles.donutHeaderRow}>
            <button className={styles.donutNavBtn} aria-label="Previous month">
              &#8249;
            </button>

            <div className={styles.donutHeaderTitle}>March 2023</div>

            <button className={styles.donutNavBtn} aria-label="Next month">
              &#8250;
            </button>
          </div>

          <div className={styles.donutWrap}>
            <svg className={styles.donutSvg} viewBox="0 0 220 220" role="img" aria-label="Donut chart">
              <circle className={styles.donutTrack} cx="110" cy="110" r="66" />
              <circle
                className={styles.segA}
                cx="110"
                cy="110"
                r="66"
                strokeDasharray="248.81 414.69"
                strokeDashoffset="0"
              />
              <circle
                className={styles.segB}
                cx="110"
                cy="110"
                r="66"
                strokeDasharray="82.94 414.69"
                strokeDashoffset="-248.81"
              />
              <circle
                className={styles.segC}
                cx="110"
                cy="110"
                r="66"
                strokeDasharray="82.94 414.69"
                strokeDashoffset="-331.75"
              />
            </svg>

            <div className={`${styles.pill} ${styles.pillA}`}>60%</div>
            <div className={`${styles.pill} ${styles.pillB}`}>20%</div>
            <div className={`${styles.pill} ${styles.pillC}`}>20%</div>
          </div>

          <div className={styles.donutLegend}>
            <div className={styles.legendRow}>
              <div className={styles.legendLeft}>
                <span className={`${styles.dot} ${styles.dotA}`} />
                <span>Option A</span>
              </div>
              <div className={styles.legendRight}>60%</div>
            </div>

            <div className={styles.legendRow}>
              <div className={styles.legendLeft}>
                <span className={`${styles.dot} ${styles.dotB}`} />
                <span>Option B</span>
              </div>
              <div className={styles.legendRight}>20%</div>
            </div>

            <div className={styles.legendRow}>
              <div className={styles.legendLeft}>
                <span className={`${styles.dot} ${styles.dotC}`} />
                <span>OptionC</span>
              </div>
              <div className={styles.legendRight}>20%</div>
            </div>
          </div>
        </div>

        {/* DAILY */}
        <div className={`${styles.card} ${styles.daily}`}>
          <div className={styles.dailyTop}>
            <div className={styles.dailyBig}>
              2h 20m <span className={styles.blueArrow}>&darr;</span>
            </div>
            <div className={styles.dailySub}>Average time you spent per day</div>
          </div>

          <div className={styles.dailyBars}>
            {[
              { d: "M", h: 32 },
              { d: "T", h: 56 },
              { d: "W", h: 24 },
              { d: "T", h: 74 },
              { d: "F", h: 60 },
              { d: "S", h: 26 },
              { d: "Today", h: 40 },
            ].map((x, idx) => (
              <div key={idx} className={styles.dailyCol}>
                <div className={styles.dailyBar} style={{ height: x.h }} />
                <div className={styles.dailyLbl}>{x.d}</div>
              </div>
            ))}
          </div>

          <div className={styles.reminderRow}>
            <div>
              <div className={styles.remTitle}>Set Daily Reminder</div>
              <div className={styles.remSub}>Reminder after you reached daily limit</div>
            </div>
            <div className={styles.remGo} aria-hidden="true">
              &#8250;
            </div>
          </div>
        </div>

        {/* OVERSPEED */}
        <div className={`${styles.card} ${styles.overspeed}`}>
          <div className={styles.smallTitle}>Overspeed</div>

          <div className={styles.gaugeWrap}>
            <svg viewBox="0 0 200 120" className={styles.gaugeSvg}>
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e6e6e6"
                strokeWidth="18"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 100 20"
                fill="none"
                stroke="url(#g1)"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2f4aff" />
                  <stop offset="100%" stopColor="#d300ff" />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b039ff" />
                  <stop offset="100%" stopColor="#4400ff" />
                </linearGradient>
              </defs>

              <polygon points="104,22 96,98 112,98" fill="url(#g2)" opacity="0.7" />
              <circle cx="104" cy="98" r="7" fill="url(#g2)" />
            </svg>

            <div className={styles.gaugeCenter}>45.85</div>

            <div className={styles.gaugeBottom}>
              <div>
                <div className={styles.alertLbl}>Alert</div>
                <div className={styles.alertVal}>08</div>
              </div>
              <div className={styles.maxSpeed}>
                <div>Max speed</div>
                <div>86 km/h</div>
              </div>
            </div>
          </div>
        </div>

        {/* AVERAGE DRIVING */}
        <div className={`${styles.card} ${styles.avgDriving}`}>
          <div className={styles.smallTitle}>Average Driving</div>
          <div className={styles.avgValue}>
            <span>14 hrs 11</span>
            <span>mins</span>
          </div>
        </div>

        {/* LINE CHART */}
        <div className={`${styles.card} ${styles.lineCard}`}>
          <div className={styles.lineTop}>
            <div className={styles.lineTitle}>Title goes here</div>
            <div className={styles.lineBig}>00</div>
          </div>

          <div className={styles.lineArea}>
            <div className={styles.dashed} />
            <div className={styles.dashed} />

            <svg viewBox="0 0 520 180" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#2256ff"
                strokeWidth="4"
                points="
                  0,70
                  40,60
                  80,80
                  120,65
                  160,85
                  200,95
                  240,110
                  280,98
                  320,120
                  360,115
                  400,130
                  440,145
                  480,150
                  520,160
                "
              />
            </svg>
          </div>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${styles.activeTab}`}>1 Day</button>
            <button className={styles.tab}>1 Month</button>
            <button className={styles.tab}>1 Year</button>
            <button className={styles.tab}>Max</button>
          </div>
        </div>

        {/* HOURS */}
        <div className={`${styles.card} ${styles.hours}`}>
          <div className={styles.hoursHeader}>
            <span className={styles.greenIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="9" width="18" height="2" rx="1" fill="#28bd67" />
                <rect x="3" y="5" width="12" height="2" rx="1" fill="#28bd67" opacity="0.7" />
                <rect x="3" y="13" width="8" height="2" rx="1" fill="#28bd67" opacity="0.7" />
              </svg>
            </span>
            <span className={styles.hoursTitle}>Bar chart</span>
          </div>

          <div className={styles.hoursBigRow}>
            <div className={styles.hoursBig}>22.6</div>
            <div className={styles.hoursSmall}>
              <div>Hours</div>
              <div>spent</div>
            </div>
          </div>

          <div className={styles.hBars}>
            {[
              { m: "Jun", b: 26, g: 7, x1: 26, grey: 22 },
              { m: "May", b: 55, g: 18, x1: 55, grey: 20 },
              { m: "Apr", b: 34, g: 12, x1: 34, grey: 28 },
              { m: "Mar", b: 70, g: 16, x1: 70, grey: 20 },
              { m: "Feb", b: 18, g: 10, x1: 18, grey: 18 },
              { m: "Jan", b: 48, g: 14, x1: 48, grey: 24 },
            ].map((r) => (
              <div key={r.m} className={styles.hRow}>
                <div className={styles.hLbl}>{r.m}</div>
                <div className={styles.hTrack}>
                  <div className={styles.hBlue} style={{ width: `${r.b}%` }} />
                  <div className={styles.hGreen} style={{ left: `${r.x1}%`, width: `${r.g}%` }} />
                  <div
                    className={styles.hGrey}
                    style={{ left: `${r.x1 + r.g}%`, width: `${r.grey}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FUEL (DYNAMIC) */}
        <div className={`${styles.card} ${styles.fuel}`}>
          <div className={styles.fuelHead}>
            <span className={styles.fuelIcon} aria-hidden="true">
              {"\u26fd"}
            </span>
            <span>Fuel Prices (PKR / Litre)</span>
          </div>

          <div className={styles.fuelGrid}>
            <div className={styles.fuelBox}>
              <div className={styles.fuelLbl}>Petrol</div>
              <div className={styles.fuelVal}>
                {fuelLoading ? "Loading..." : fuel.petrol ? `Rs. ${fuel.petrol}` : "--"}
              </div>
            </div>

            <div className={styles.fuelBox}>
              <div className={styles.fuelLbl}>Diesel</div>
              <div className={styles.fuelVal}>
                {fuelLoading ? "Loading..." : fuel.diesel ? `Rs. ${fuel.diesel}` : "--"}
              </div>
            </div>
          </div>

          <div className={styles.updated}>
            {fuelError
              ? fuelError
              : fuel.updatedAt
              ? `Last updated: ${fuel.updatedAt}`
              : "Last updated: --"}
          </div>
        </div>

        <div className={styles.spacer} />
      </div>
    </div>
  );
};

export default Dashboard;
