import React, { useState, useEffect, useCallback } from "react";
import styles from "./Dashboard.module.css";
import Image from "next/image";

// Server-side fetch function for initial weather data
export async function getServerSideProps() {
  const defaultCity = "Karachi";
  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=96bdb80fc61b462eb44145243252605&q=${encodeURIComponent(
        defaultCity
      )}&aqi=no`
    );
    const data = await res.json();

    return {
      props: {
        initialWeather: {
          temp_c: data.current.temp_c,
          condition: data.current.condition,
          locationLabel: `${data.location.name}, ${data.location.country}`,
          localtime: data.location.localtime,
        },
      },
    };
  } catch (e) {
    return {
      props: {
        initialWeather: null,
      },
    };
  }
}

const Dashboard = ({ initialWeather }) => {
  const [engineOn, setEngineOn] = useState(false);
  const [city, setCity] = useState(initialWeather?.locationLabel.split(",")[0] || "Karachi");
  const [locationLabel, setLocationLabel] = useState(initialWeather?.locationLabel || "Loading...");
  const [weather, setWeather] = useState(
    initialWeather
      ? {
          temp_c: initialWeather.temp_c,
          condition: initialWeather.condition,
        }
      : { temp_c: null, condition: { text: "", icon: "" } }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState("");
  const [date, setDate] = useState(new Date());
  const [timeString, setTimeString] = useState("");

  // Determine time of day helper
  const determineTimeOfDay = (localTimeStr) => {
    if (!localTimeStr) return "";
    const hour = parseInt(localTimeStr.split(" ")[1].split(":")[0], 10);
    if (hour >= 5 && hour < 12) return "Morning";
    else if (hour >= 12 && hour < 18) return "Evening";
    else return "Night";
  };

  useEffect(() => {
    if (initialWeather?.localtime) {
      setTimeOfDay(determineTimeOfDay(initialWeather.localtime));
    }
  }, [initialWeather]);

  // Weather icon mapping to your uploaded images
  const getCustomWeatherIcon = (conditionText) => {
    if (!conditionText) return "/Weather/Default.png";

    const condition = conditionText.toLowerCase();

    if (condition.includes("sunny")) return "/Weather/MostlySunny.png";
    if (condition.includes("clear")) return "/Weather/Partly-Cloudy-(Night).png";
    if (condition.includes("partly cloudy")) return "/Weather/PartlyCloudy(Day).png";
    // if (condition.includes("cloudy")) return "/Weather/PartlyCloudy(Day).png";

    if (
      condition.includes("rain") ||
      condition.includes("drizzle") ||
      condition.includes("shower") ||
      condition.includes("showers")
    )
      return "/Weather/Rainy.png";

    if (condition.includes("thunder")) return "/Weather/Thunderstorm.png";

    if (
      condition.includes("snow") ||
      condition.includes("sleet") ||
      condition.includes("blizzard") ||
      condition.includes("ice")
    )
      return "/Weather/Snowy.png";

    if (condition.includes("overcast")) return "/Weather/Partly-Cloudy-with-Rain.png";

    if (
      condition.includes("mist") ||
      condition.includes("fog") ||
      condition.includes("haze") ||
      condition.includes("smoke") ||
      condition.includes("dust") ||
      condition.includes("sand")
    )
      return "/Weather/Foggy.png";

    return "/Weather/Default.png";
  };

  const displayCondition = (text) => {
    if (!text) return "Loading...";
    if (text.toLowerCase().includes("mist")) return "Partly Cloudy (Day)";
    return text;
  };

  // Fetch weather data client-side
  const fetchWeather = async (query) => {
    if (!query || query.trim() === "") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=96bdb80fc61b462eb44145243252605&q=${encodeURIComponent(
          query
        )}&aqi=no`
      );
      if (!res.ok) throw new Error("Failed to fetch weather data");
      const data = await res.json();

      setWeather({
        temp_c: data.current.temp_c,
        condition: data.current.condition,
      });
      setLocationLabel(`${data.location.name}, ${data.location.country}`);
      setTimeOfDay(determineTimeOfDay(data.location.localtime));
    } catch (err) {
      setError("Please enter a valid city name");
      setTimeOfDay("");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (city.trim() !== "") {
      fetchWeather(city.trim());
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeather(`${latitude},${longitude}`);
        },
        () => {
          fetchWeather(city);
        }
      );
    } else {
      fetchWeather(city);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeather(city);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [city]);

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

  // Clock hand angles
  const seconds = date.getSeconds();
  const minutes = date.getMinutes();
  const hours = date.getHours() % 12;
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = (minutes / 60) * 360;
  const hourAngle = (hours / 12) * 360 + (minutes / 60) * 30;

  return (
    <div className={styles.dashboard}>
      {/* WEATHER */}
      <div className={styles["weather-card"]}>
        <div className={styles["weather-info"]}>
          <input
            type="text"
            placeholder="Search city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "8px",
              fontSize: "0.9rem",
            }}
            disabled={loading}
          />
          <div className={styles.temp}>
            {loading ? "Loading..." : weather.temp_c !== null ? `${weather.temp_c}°` : "--"}
          </div>
          <div className={styles.location}>
            {locationLabel} {timeOfDay && `- ${timeOfDay}`}
          </div>
          {error && <div style={{ color: "red", marginTop: "6px" }}>{error}</div>}
        </div>
        <div className={styles["weather-icon"]}>
          {weather.condition.text && !loading ? (
            <>
              <Image
                src={getCustomWeatherIcon(weather.condition.text)}
                alt="Weather"
                width={56}
                height={56}
                unoptimized
              />
              {displayCondition(weather.condition.text)}
            </>
          ) : (
            <>
              <Image src="/Weather/Default.png" alt="Weather Icon" width={56} height={56} />
              <span>{loading ? "Loading..." : ""}</span>
            </>
          )}
        </div>
      </div>

      {/* === Engine Card === */}
      <div className={styles.engine}>
        <div className={styles["engine-left"]}>
          <div className={styles.label}>Engine</div>
          <div className={styles["switch-label"]}>Switch</div>
        </div>
        <label
          className={styles["toggle-switch"]}
          tabIndex={0}
          aria-label="Engine switch toggle"
        >
          <input
            type="checkbox"
            checked={engineOn}
            onChange={() => setEngineOn(!engineOn)}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      {/* === Time Card === */}
      <div className={`${styles.card} ${styles.time}`}>
        <div className={styles.timeContent}>
          <div className={styles.left}>
            <h3>Time</h3>
            <div className={styles.date}>
              {date.toLocaleDateString("en-PK")}
            </div>
            <div className={styles.date}>{timeString}</div>
          </div>
          <div className={styles.clock} aria-label="Analog clock">
            <svg
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.clockFace}
            >
              <circle cx="256" cy="256" r="245" />
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
                    stroke="#000"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                );
              })}

              <line
                x1="256"
                y1="256"
                x2="256"
                y2="160"
                className={styles.hour}
                style={{
                  transformOrigin: "256px 256px",
                  transform: `rotate(${hourAngle}deg)`,
                }}
              />
              <line
                x1="256"
                y1="256"
                x2="256"
                y2="110"
                className={styles.minute}
                style={{
                  transformOrigin: "256px 256px",
                  transform: `rotate(${minuteAngle}deg)`,
                }}
              />
              <line
                x1="256"
                y1="256"
                x2="256"
                y2="85"
                className={styles.second}
                style={{
                  transformOrigin: "256px 256px",
                  transform: `rotate(${secondAngle}deg)`,
                }}
              />
              <circle cx="256" cy="256" r="6" fill="#d53e3e" />
            </svg>
          </div>
        </div>
      </div>

      {/* Saving Card */}
      <div className={`${styles.card} ${styles.saving}`}>
        <div className={styles.title}>$1250</div>
        <div className={styles.subtitle}>Your total saving so far</div>
        <div className={styles.chart}>
          <svg
            viewBox="0 0 400 160"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3f57ff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#b7c4ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              fill="url(#grad)"
              stroke="#3f57ff"
              strokeWidth="2"
              d="
                M 0 90
                L 30 75
                L 60 80
                L 90 65
                L 120 75
                L 150 70
                L 180 90
                L 210 85
                L 240 70
                L 270 85
                L 300 70
                L 330 95
                L 360 70
                L 390 80
                L 400 90
                L 400 160
                L 0 160 Z
              "
            />
            <line
              x1="310"
              y1="0"
              x2="310"
              y2="160"
              stroke="#3f57ff"
              strokeWidth="1"
            />
          </svg>
          <div
            className={styles["highlight-circle"]}
            style={{ left: "310px" }}
          ></div>
          <div className={styles.tooltip} style={{ left: "310px" }}>
            $1250
          </div>
        </div>
        <button className={styles.button}>Details</button>
      </div>

      {/* Donut Chart */}
      <div className={`${styles.card} ${styles.donut}`}>
        <div className={styles.month}>March 2023</div>
        <div className={styles["chart-container"]}>
          <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <circle className={styles["option-a"]} r="54" cx="60" cy="60" />
            <circle className={styles["option-b"]} r="54" cx="60" cy="60" />
            <circle className={styles["option-c"]} r="54" cx="60" cy="60" />
          </svg>
        </div>
        <div className={styles.legend}>
          <div>
            <span
              className={`${styles["color-box"]} ${styles["option-a-box"]}`}
            ></span>
            Option A <span className={styles.percent}>60%</span>
          </div>
          <div>
            <span
              className={`${styles["color-box"]} ${styles["option-b-box"]}`}
            ></span>
            Option B <span className={styles.percent}>20%</span>
          </div>
          <div>
            <span
              className={`${styles["color-box"]} ${styles["option-c-box"]}`}
            ></span>
            Option C <span className={styles.percent}>20%</span>
          </div>
        </div>
      </div>

      {/* Daily Time */}
      <div className={`${styles.card} ${styles["daily-time"]}`}>
        <div className={styles["avg-time"]}>
          2h 20m <span className={styles.arrow}></span>
        </div>
        <div className={styles["avg-label"]}>
          Average time you spent per day
        </div>

        <div className={styles["bar-chart-with-labels"]}>
          {["m", "t", "w", "th", "f", "s", "today"].map((day) => (
            <div key={day} className={styles["bar-with-label"]}>
              <div className={`${styles.bar} ${styles[day]}`}></div>
              <div className={styles.label}>
                {day === "th" ? "T" : day.charAt(0).toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.reminder}>
          <div className={styles["reminder-title"]}>Set Daily Reminder</div>
          <div className={styles["reminder-subtitle"]}>
            Reminder after you reached daily limit
          </div>
        </div>
      </div>

      {/* Overspeed */}
      <div className={`${styles.card} ${styles.overspeed}`}>
        <div className={styles.title}>Overspeed</div>
        <div className={styles.gauge} aria-label="Overspeed gauge">
          <svg
            viewBox="0 0 160 100"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-hidden="false"
          >
            <defs>
              <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2f4aff" />
                <stop offset="100%" stopColor="#d300ff" />
              </linearGradient>
              <linearGradient id="needleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#b039ff" />
                <stop offset="100%" stopColor="#4400ff" />
              </linearGradient>
            </defs>
            <path
              d="M 10 90 A 70 70 0 0 1 150 90"
              fill="none"
              stroke="#ddd"
              strokeWidth="18"
            />
            <path
              d="M 10 90 A 70 70 0 0 1 80 20"
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <polygon points="82,20 77,85 87,85" fill="url(#needleGradient)" />
            <circle cx="82" cy="85" r="7" fill="url(#needleGradient)" />
          </svg>
          <div className={styles["alert-label"]}>Alert</div>
          <div className={styles.alert}>08</div>
          <div className={styles["max-speed"]}>
            <div>Max speed</div>
            <div>86 km/h</div>
          </div>
        </div>
      </div>

      {/* Average Driving */}
      <div className={`${styles.card} ${styles["average-driving"]}`}>
        <div className={styles.title}>Average Driving</div>
        <div className={styles.time}>
          <strong>14 hrs 11 mins</strong>
        </div>
      </div>

      {/* Line Chart */}
      <div className={`${styles.card} ${styles["line-chart-card"]}`}>
        <div className={styles.title}>Title goes here</div>
        <div className={styles["big-num"]}>00</div>
        <div className={styles["line-chart"]}>
          <svg
            viewBox="0 0 400 140"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="#2256ff"
              strokeWidth="2"
              points="
                0,100
                40,90
                80,85
                120,70
                160,75
                200,60
                240,70
                280,65
                320,55
                360,45
                400,35
              "
            />
          </svg>
        </div>
        <div className={styles.tabs}>
          <div className={`${styles.tab} ${styles.active}`}>1 Day</div>
          <div className={styles.tab}>1 Month</div>
          <div className={styles.tab}>1 Year</div>
          <div className={styles.tab}>Max</div>
        </div>
      </div>

      {/* Hours Spent Bar Chart */}
      <div className={`${styles.card} ${styles["hours-spent"]}`}>
        <div className={styles.header}>
          <svg
            style={{ verticalAlign: "middle" }}
            width="16"
            height="16"
            fill="#28bd67"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="9" width="18" height="2" rx="1" />
          </svg>
          Bar chart
        </div>
        <div className={styles.subheader}>
          <span className={styles["big-number"]}>22.6</span>{" "}
          <small>Hours spent</small>
        </div>
        <div className={styles["bar-chart-horizontal"]}>
          {[
            {
              label: "Jun",
              blue: "20%",
              green: "8%",
              grey: "40%",
              greenLeft: "20%",
              greyLeft: "28%",
            },
            {
              label: "May",
              blue: "37%",
              green: "21%",
              grey: "30%",
              greenLeft: "37%",
              greyLeft: "58%",
            },
            {
              label: "Apr",
              blue: "23%",
              green: "12%",
              grey: "40%",
              greenLeft: "23%",
              greyLeft: "35%",
            },
            {
              label: "Mar",
              blue: "43%",
              green: "15%",
              grey: "22%",
              greenLeft: "43%",
              greyLeft: "58%",
            },
            {
              label: "Feb",
              blue: "12%",
              green: "12%",
              grey: "50%",
              greenLeft: "12%",
              greyLeft: "24%",
            },
            {
              label: "Jan",
              blue: "30%",
              green: "15%",
              grey: "40%",
              greenLeft: "30%",
              greyLeft: "45%",
            },
          ].map(({ label, blue, green, grey, greenLeft, greyLeft }) => (
            <div key={label} className={styles["bar-row"]}>
              <div className={styles["bar-label"]}>{label}</div>
              <div className={styles.bar} style={{ position: "relative" }}>
                <div className={styles.blue} style={{ width: blue }}></div>
                <div
                  className={styles.green}
                  style={{
                    left: greenLeft,
                    width: green,
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                  }}
                ></div>
                <div
                  className={styles.grey}
                  style={{
                    left: greyLeft,
                    width: grey,
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    opacity: 0.3,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === Fuel Prices === */}
      <div className={`${styles.card} ${styles.fuelCard}`}>
        <div className={styles.fuelHeader}>
          <span>🛢️</span> Fuel Prices (PKR / Litre)
        </div>
        <div className={styles.fuelRow}>
          <div className={styles.fuelType}>
            <div className={styles.label}>Petrol</div>
            <div className={styles.fuelPrice}>Rs. 275.50</div>
          </div>
          <div className={styles.fuelType}>
            <div className={styles.label}>Diesel</div>
            <div className={styles.fuelPrice}>Rs. 288.75</div>
          </div>
        </div>
        <div className={styles.updated}>Last updated: May 27, 2025</div>
      </div>
    </div>
  );
};

export default Dashboard;
