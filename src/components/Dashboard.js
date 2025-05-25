import React, { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const [engineOn, setEngineOn] = useState(false);
  const [date, setDate] = useState(new Date());

  // Update the clock every second
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate clock hand rotation angles
  const seconds = date.getSeconds();
  const minutes = date.getMinutes();
  const hours = date.getHours() % 12;
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = (minutes / 60) * 360;
  const hourAngle = (hours / 12) * 360 + (minutes / 60) * 30;

  return (
    <div className={styles.dashboard}>
      {/* Weather Card */}
      <div
        className={styles["weather-card"]}
        role="region"
        aria-label="Weather information"
      >
        <div className={styles["weather-info"]}>
          <div className={styles.temp}>20°</div>
          <div className={styles.location}>Karachi, Pakistan</div>
        </div>
        <div className={styles["weather-icon"]}>
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="24" cy="28" rx="18" ry="14" fill="#4A90E2" />
            <ellipse cx="38" cy="22" rx="18" ry="14" fill="#7BB3F9" />
            <ellipse cx="32" cy="36" rx="14" ry="12" fill="#5C9BFF" />
            <ellipse cx="26" cy="46" rx="3.5" ry="7" fill="#3366FF" />
            <ellipse cx="34" cy="50" rx="3.5" ry="7" fill="#3366FF" />
            <ellipse cx="44" cy="46" rx="3.5" ry="7" fill="#3366FF" />
          </svg>
          Rainy
        </div>
      </div>

      {/* Engine Card */}
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

      {/* Time Card */}
      <div className={`${styles.card} ${styles.time}`}>
        <h3>Time</h3>
        <div className={styles.date}>{date.toLocaleDateString()}</div>
        <div className={styles.clock} aria-label="Analog clock">
          <svg
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-hidden="false"
          >
            <circle cx="32" cy="32" r="30" />
            <line
              className={styles.hour}
              x1="32"
              y1="32"
              x2="32"
              y2="14"
              style={{
                transformOrigin: "32px 32px",
                transform: `rotate(${hourAngle}deg)`,
              }}
            />
            <line
              className={styles.minute}
              x1="32"
              y1="32"
              x2="48"
              y2="32"
              style={{
                transformOrigin: "32px 32px",
                transform: `rotate(${minuteAngle}deg)`,
              }}
            />
            <line
              className={styles.second}
              x1="32"
              y1="32"
              x2="32"
              y2="52"
              style={{
                transformOrigin: "32px 32px",
                transform: `rotate(${secondAngle}deg)`,
              }}
            />
          </svg>
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
    </div>
  );
};

export default Dashboard;
