"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import {
  FaBatteryHalf,
  FaBell,
  FaBroadcastTower,
  FaCarSide,
  FaChartLine,
  FaChevronRight,
  FaCog,
  FaCrosshairs,
  FaDoorOpen,
  FaDotCircle,
  FaEye,
  FaExclamationTriangle,
  FaFileAlt,
  FaGasPump,
  FaGlobe,
  FaInfoCircle,
  FaLocationArrow,
  FaLock,
  FaMapMarkerAlt,
  FaPowerOff,
  FaRegCircle,
  FaRoad,
  FaShareAlt,
  FaSyncAlt,
  FaTachometerAlt,
  FaThermometerHalf,
  FaTint,
  FaTruck,
  FaUserAlt,
} from "react-icons/fa";
import styles from "./TelemetryPanel.module.css";

const fallbackVehicle = {
  vehicle_no: "TS-0001",
  vehicle_type: "SUV",
  driver_name: "Samama Anees",
  mobile_no: "03132258597",
  speed: 0,
  location_name: "Shahrah Faisal, Karachi",
  latitude: 24.904,
  longitude: 67.08,
  movement_status: "STOP",
  imei_id: "350424066474667",
};

const activityRows = [
  { label: "Running", value: "00:00 hrs", color: "#2fb04a" },
  { label: "Idle", value: "00:00 hrs", color: "#f5b400" },
  { label: "Stop", value: "00:00 hrs", color: "#ef4f4f" },
  { label: "In active", value: "00:00 hrs", color: "#3d57f5" },
  { label: "Work Hour", value: "00:00 hrs", color: "#7a808f" },
];
const makeDigits = (source) => {
  const normalized = String(source ?? "").replace(/\D/g, "").slice(0, 7);
  return normalized.padEnd(7, "0").split("");
};
function InfoRows({ rows }) {
  return (
    <div className={styles.infoRows}>
      {rows.map((row) => (
        <div key={row.label} className={styles.infoRow}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}
function MiniCard({ title, children, trailing }) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <span>{title}</span>
        {trailing || <span />}
      </div>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

export default function TelemetryPanel({ isOpen, vehicle }) {
  const data = vehicle || fallbackVehicle;

  const view = useMemo(() => {
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    const tripKm = Number(data.current_trip_km ?? data.speed ?? 0);
    const speed = Number(data.speed ?? 0);
    const battery = Number(data.battery_level ?? 0);

    return {
      plate: data.vehicle_no || data.imei_id || "N/A",
      type: data.vehicle_type || "Vehicle",
      status: String(data.movement_status || "STOP").toUpperCase(),
      location: data.location_name || "N/A",
      lat: Number.isFinite(lat) ? lat.toFixed(6) : "N/A",
      lng: Number.isFinite(lng) ? lng.toFixed(6) : "N/A",
      tripKm: Number.isFinite(tripKm) ? tripKm.toFixed(2) : "0.00",
      speed: Number.isFinite(speed) ? speed.toFixed(0) : "0",
      driver: data.driver_name || "N/A",
      mobile: data.mobile_no || "N/A",
      imei: data.imei_id || "N/A",
      battery: Number.isFinite(battery) ? battery.toFixed(1) : "0.0",
      digits: makeDigits(data.odometer ?? data.imei_id ?? "0"),
    };
  }, [data]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside className={`${styles.panel} ${isOpen ? styles.open : ""}`} aria-hidden={!isOpen}>
      <div className={styles.inner}>
        <div className={styles.topTabs}>
          <button type="button" className={styles.tabBtn}><FaUserAlt /></button>
          <button type="button" className={styles.tabBtn}><FaTruck /></button>
          <button type="button" className={styles.tabBtn}><FaCog /></button>
        </div>

        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.vehicleTypeRow}><span>Vehicle Type</span><FaInfoCircle /></div>
              <div className={styles.vehicleTypeValue}>{view.type}</div>
              <div className={styles.vehicleImageWrap}>
                <Image src="/icons/placeholder-suv.png" alt={view.type} width={146} height={74} priority />
              </div>
              <div className={styles.tagRow}>
                <span className={styles.plate}>{view.plate}</span>
                <span className={styles.stop}>{view.status === "STOP" ? "STOP" : view.status}</span>
              </div>
              <div className={styles.infoRowCompact}><span>Current Trip</span><strong>{view.tripKm} km</strong></div>
              <div className={styles.digitRow}>{view.digits.map((digit, idx) => <span key={`${digit}-${idx}`} className={styles.digitCell}>{digit}</span>)}</div>
              <div className={styles.infoRowCompact}><span>Driver</span><strong>{view.driver}</strong></div>
              <div className={styles.infoRowCompact}><span>Mobile</span><strong>{view.mobile}</strong></div>
              <div className={styles.infoRowCompact}><span>Details</span><strong><FaInfoCircle /></strong></div>
            </div>
            <div className={styles.quickActions}>
              <button type="button"><FaEye /></button>
              <button type="button"><FaShareAlt /></button>
              <button type="button"><FaLocationArrow /></button>
              <button type="button"><FaMapMarkerAlt /></button>
              <button type="button"><FaBell /></button>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.infoRowCompact}><span><FaMapMarkerAlt /> Location</span><FaChevronRight /></div>
              <div className={styles.miniMuted}>{view.lat},{view.lng}</div>
              <div className={styles.infoRowCompact}><span><FaDotCircle /> Geofence</span><span /></div>
              <div className={styles.miniMuted}>{view.location}</div>
            </div>
            <div className={styles.smallFooterTabs}>
              <button type="button"><FaRegCircle /></button>
              <button type="button"><FaUserAlt /></button>
              <button type="button"><FaGlobe /></button>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><span>Today Activity</span><FaSyncAlt /></div>
            <div className={styles.cardBody}>
              <div className={styles.activityWrap}>
                <div className={styles.donut} />
                <div className={styles.activityRows}>
                  {activityRows.map((row) => (
                    <div key={row.label} className={styles.activityRow}>
                      <span><i style={{ backgroundColor: row.color }} />{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.infoRowCompact}><span>Working Start</span><strong>--</strong></div>
              <div className={styles.infoRowCompact}><span>Last Stop</span><strong>--</strong></div>
            </div>
            <div className={styles.orangeAction}>Show Log</div>
          </section>

          <MiniCard title="Speed" trailing={<FaSyncAlt />}>
            <InfoRows rows={[
              { label: "Average Speed", value: `${view.speed} km/h` },
              { label: "Maximum Speed", value: `${view.speed} km/h` },
              { label: "Speed Limit", value: "60" },
            ]} />
          </MiniCard>

          <section className={styles.card}>
            <div className={styles.cardHead}><span><FaExclamationTriangle /> Alert</span><strong>Total 0</strong></div>
            <div className={styles.cardBody}><div className={styles.infoRow}><span>Total</span><strong>0 km/h</strong></div></div>
            <div className={styles.orangeAction}>+ Alert</div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><span><FaGasPump /> Fuel</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.fuelGauge}><div className={styles.fuelNeedle} /></div>
              <InfoRows rows={[
                { label: "Refill", value: "80%" },
                { label: "Drain", value: "5%" },
                { label: "Tank Capacity", value: "20%" },
                { label: "Fuel Consumption", value: "0" },
                { label: "Fuel Temperature", value: "60 C" },
              ]} />
            </div>
          </section>

          <MiniCard title={<span className={styles.cardTitle}><FaChartLine /> Fuel Usage</span>} trailing={<span />}>
            <InfoRows rows={[
              { label: "Distance", value: "0 ltr" },
              { label: "Duration", value: "0 ltr" },
              { label: "Waste", value: "0 ltr" },
            ]} />
            <div className={styles.centerMuted}>Due to 0 hrs idling</div>
          </MiniCard>

          <section className={styles.card}>
            <div className={styles.cardHead}><span><FaThermometerHalf /> Temperature</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.temperatureValue}>36.C</div>
              <InfoRows rows={[{ label: "Min", value: "10.0 C" }, { label: "Max", value: "45.0 C" }]} />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><span><FaFileAlt /> Job</span><span /></div>
            <div className={styles.cardBody}>
              <InfoRows rows={[{ label: "Allocated", value: "0" }, { label: "Complete", value: "0" }]} />
            </div>
            <div className={styles.dualActionRow}><button type="button">+ Job</button><button type="button">History</button></div>
          </section>

          <MiniCard title={<span className={styles.cardTitle}><FaMapMarkerAlt /> Near By</span>} trailing={<span />}>
            Karachi, Toll-Plaaz...
          </MiniCard>

          <MiniCard title={<span className={styles.cardTitle}><FaCrosshairs /> GPS Device Parameter</span>} trailing={<span />}>
            <InfoRows rows={[
              { label: "Axis X", value: "-14" },
              { label: "Axis Y", value: "2" },
              { label: "Axis Z", value: "-35" },
              { label: "GNSS Status", value: "1" },
              { label: "Satellites", value: "19" },
              { label: "Ext Power", value: "0 Voltage" },
              { label: "Int Battery %", value: "32" },
              { label: "Movement", value: "OFF" },
              { label: "Angle", value: "29" },
              { label: "Altitude", value: "116" },
            ]} />
          </MiniCard>

          <MiniCard title={<span className={styles.cardTitle}><FaGlobe /> Network Parameter</span>} trailing={<span />}>
            <InfoRows rows={[
              { label: "Altitude", value: "2" },
              { label: "Altitude", value: "NA" },
              { label: "Altitude", value: "NA" },
              { label: "Altitude", value: "NA" },
            ]} />
          </MiniCard>

          <section className={styles.card}>
            <div className={styles.orangeActionRow}><span><FaLock /> Immobilize Door</span><FaChevronRight /></div>
          </section>

          <MiniCard title={<span className={styles.cardTitle}><FaUserAlt /> Driver Information</span>} trailing={<span />}>
            <InfoRows rows={[
              { label: "Driver Number", value: "NA" },
              { label: "Age", value: "NA" },
              { label: "Driving Experience", value: "NA" },
              { label: "Licence Available", value: "NA" },
              { label: "License To Drive", value: "NA" },
              { label: "License Expiry", value: "NA" },
              { label: "Life Ins. Expiry", value: "NA" },
              { label: "Mediclaim Expiry", value: "NA" },
            ]} />
          </MiniCard>

          <MiniCard title={<span className={styles.cardTitle}><FaBroadcastTower /> GPS Device Information</span>} trailing={<span />}>
            <InfoRows rows={[
              { label: "Device", value: "FMB920" },
              { label: "Device Status", value: "Disconnected" },
              { label: "Last Date", value: "22 Hour Ago" },
              { label: "IMEI", value: view.imei },
              { label: "Installation Date", value: "26-02-2025 12:00 AM" },
              { label: "Warranty", value: "0.0" },
            ]} />
          </MiniCard>

          <section className={styles.card}>
            <div className={styles.expenseRow}>
              <div className={styles.expenseLeft}>Expenses (last 7 days)</div>
              <strong>Rs0.00</strong>
            </div>
            <div className={styles.dualActionRow}><button type="button">+ Job</button><button type="button">History</button></div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><span><FaFileAlt /> Documents</span><span /></div>
            <div className={styles.cardBody}>No Record Found</div>
            <div className={styles.orangeAction}>+ Document</div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><span className={styles.cardTitle}><FaChartLine /> Work Efficiency</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}><span>00:00 hrs of 0 hrs</span><span /></div>
              <div className={styles.progressBar}><span style={{ width: "0%" }} /></div>
              <div className={styles.infoRow}><span>0 kms of 0 kms</span><span /></div>
              <div className={styles.progressBar}><span style={{ width: "0%" }} /></div>
            </div>
          </section>

          <MiniCard title={<span className={styles.cardTitle}><FaCarSide /> ADAS</span>} trailing={<span />}><InfoRows rows={[{ label: "Total", value: "0" }]} /></MiniCard>

          <MiniCard title={<span className={styles.cardTitle}><FaCarSide /> Object Information</span>} trailing={<span />}>
            <InfoRows rows={[
              { label: "Purchase Date", value: "0" },
              { label: "Purchase Amount", value: "0" },
              { label: "Seat Capacity", value: "0" },
              { label: "Capacity", value: "0" },
              { label: "Company Average", value: "0" },
              { label: "Object Brand", value: "AMW" },
              { label: "Permit Name", value: "0" },
              { label: "Object Model", value: "1618 TP" },
              { label: "Age", value: "0" },
              { label: "VIN (Chassis) Number", value: "0" },
              { label: "Engine No", value: "0" },
              { label: "Object Category", value: "Movable" },
            ]} />
          </MiniCard>

          <MiniCard title={<span className={styles.cardTitle}><FaEye /> DMS</span>} trailing={<span />}><InfoRows rows={[{ label: "Total", value: "0" }]} /></MiniCard>
          <MiniCard title={<span className={styles.cardTitle}><FaRoad /> Toll Information</span>} trailing={<span />}>No Record Found</MiniCard>

          <section className={styles.card}>
            <div className={styles.cardHead}><span className={styles.cardTitle}><FaBatteryHalf /> Battery Level</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.batteryPct}>{view.battery}%</div>
              <InfoRows rows={[
                { label: "Range", value: "0.00km" },
                { label: "Capacity", value: "0.0 mah" },
                { label: "Est. Full Charge", value: "00:00 hrs" },
                { label: "Charging Event", value: "0" },
              ]} />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><span className={styles.cardTitle}><FaBatteryHalf /> Battery Usage</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.barsChart}>
                <span style={{ height: "22%" }} />
                <span style={{ height: "38%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "84%" }} />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><span><FaBell /> Reminder</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.reminderGrid}>
                <div><small>Due</small><strong>1</strong></div>
                <div><small>Overdue</small><strong>0</strong></div>
                <div><small>Upcoming</small><strong>1</strong></div>
              </div>
            </div>
            <div className={styles.orangeAction}>+ Add Reminder</div>
          </section>

          <section className={styles.card}><div className={styles.orangeAction}>No Humidity Sensor Found</div></section>
          <MiniCard title={<span className={styles.cardTitle}><FaDoorOpen /> Tanker Door</span>} trailing={<span />}>No Record Found</MiniCard>
          <MiniCard title="No Load Sensor" trailing={<span />}>Found</MiniCard>
          <MiniCard title="Beacon" trailing={<strong>0</strong>}><span>Connected</span></MiniCard>
          <MiniCard title="Euro sense Degree BT" trailing={<span />}>No Record Found</MiniCard>
          <MiniCard title="Eye Sensor" trailing={<span />}>No Record Found</MiniCard>
          <MiniCard title={<span className={styles.cardTitle}><FaTint /> Flow Meter</span>} trailing={<span />}>No Record Found</MiniCard>
          <MiniCard title={<span className={styles.cardTitle}><FaTint /> Alcohol Level</span>} trailing={<span />}>No Record Found</MiniCard>

          <MiniCard title={<span className={styles.cardTitle}><FaUserAlt /> Passenger Seat</span>} trailing={<span />}>
            <InfoRows rows={[{ label: "Occupied", value: "0" }, { label: "Vacant", value: "0" }]} />
          </MiniCard>

          <section className={styles.card}>
            <div className={styles.cardHead}><span><FaTachometerAlt /> RPM</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.rpmMeter}><div className={styles.rpmNeedle} /></div>
              <InfoRows rows={[{ label: "Lowest", value: "0 RPM" }, { label: "Highest", value: "0 RPM" }]} />
            </div>
          </section>

          <MiniCard title={<span className={styles.cardTitle}><FaBroadcastTower /> DVR State</span>} trailing={<span />}>No Record Found</MiniCard>

          <section className={styles.card}>
            <div className={styles.cardHead}><span className={styles.cardTitle}><FaTachometerAlt /> Pressure Gauge</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.pressureGauge}><div className={styles.pressureNeedle} /></div>
              <InfoRows rows={[
                { label: "Safe", value: "0-0" },
                { label: "Warning", value: "0-0" },
                { label: "Critical", value: "0-0" },
              ]} />
            </div>
          </section>

          <MiniCard title={<span className={styles.cardTitle}><FaBroadcastTower /> Recording</span>} trailing={<span />}>No Record Found</MiniCard>

          <section className={styles.card}>
            <div className={styles.cardHead}><span className={styles.cardTitle}><FaTint /> Ad Blue</span><span /></div>
            <div className={styles.cardBody}>
              <div className={styles.adBlueGauge} />
              <InfoRows rows={[
                { label: "Low Level", value: "0 ltr" },
                { label: "Refill", value: "0 ltr" },
                { label: "Drain", value: "0 ltr" },
              ]} />
            </div>
          </section>

          <MiniCard title={<span className={styles.cardTitle}><FaCarSide /> Driver Behavior</span>} trailing={<span />}>No Record Found</MiniCard>
          <MiniCard title={<span className={styles.cardTitle}><FaDoorOpen /> Door</span>} trailing={<span />}>No Record Found</MiniCard>
          <MiniCard title={<span className={styles.cardTitle}><FaPowerOff /> Power Mode</span>} trailing={<span />}>No Record Found</MiniCard>
        </div>
      </div>
    </aside>
  );
}
