"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MapControls from "@/components/MapControls";
import TelemetryPanel from "@/components/TelemetryPanel";
import { useAuth } from "@/app/fleet-dashboard/useAuth";
import { useMapData } from "@/app/fleet-dashboard/useMapData";
import styles from "@/app/page.module.css";

const Tracking = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

export default function TrackingPage() {
  const SIDEBAR_WIDTH = 70;
  const mapRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeGroups, setActiveGroups] = useState([]);
  const [showVehicles, setShowVehicles] = useState(true);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [telemetryVehicle, setTelemetryVehicle] = useState(null);
  const [geofences, setGeofences] = useState([]);
  const [geofenceError, setGeofenceError] = useState(null);
  const { authChecked, isAuthenticated } = useAuth();
  const { groupedVehicles, fetchCompanyMapData } = useMapData();

  useEffect(() => {
    if (authChecked && isAuthenticated) fetchCompanyMapData();
  }, [authChecked, isAuthenticated, fetchCompanyMapData]);

  useEffect(() => {
    if (activeGroups.length === 0 && Object.keys(groupedVehicles).length > 0) {
      setActiveGroups(Object.keys(groupedVehicles));
    }
  }, [groupedVehicles, activeGroups.length]);

  const fetchGeofences = useCallback(async () => {
    setGeofenceError(null);
    try {
      const response = await fetch("/api/geofences?company=default_company");
      if (!response.ok) throw new Error("Failed to fetch geofences");
      const data = await response.json();
      setGeofences(Array.isArray(data) ? data : []);
    } catch (error) {
      setGeofenceError(error.message);
    }
  }, []);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  const handleGeofenceCreated = useCallback(
    async (geofenceShape) => {
      const name = window.prompt("Please enter a name for the new geofence:");
      if (!name) return;

      try {
        const response = await fetch("/api/geofences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            type: geofenceShape.type,
            data: geofenceShape.data,
            company: "default_company",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to save geofence");
        }
        fetchGeofences();
      } catch (error) {
        setGeofenceError(error.message);
      }
    },
    [fetchGeofences]
  );

  if (!authChecked || !isAuthenticated) return null;

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Header />
      <div
        className={styles.contentArea}
        style={{ marginLeft: isSidebarOpen ? `${SIDEBAR_WIDTH}px` : "0" }}
      >
        {geofenceError && (
          <div className={styles.errorBanner}>
            Geofence Error: {geofenceError}{" "}
            <button onClick={() => setGeofenceError(null)} className={styles.dismissErrorButton}>
              Dismiss
            </button>
          </div>
        )}
        <div className={styles.mapContainer}>
          <Tracking
            whenReady={(map) => {
              mapRef.current = map;
            }}
            showVehiclesLayer={showVehicles}
            vehicleData={groupedVehicles}
            activeGroups={activeGroups}
            onVehicleClick={(vehicle) => {
              setTelemetryVehicle(vehicle);
              setIsTelemetryOpen(true);
            }}
            geofences={geofences}
            onGeofenceCreated={handleGeofenceCreated}
            showBuiltInControls={false}
          />
          <MapControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onControlClick={(id) => {
              if (id === "toggleSidebar") setIsTelemetryOpen((prev) => !prev);
              if (id === "send") setShowVehicles((prev) => !prev);
            }}
            isPanelOpen={isTelemetryOpen}
          />
          <TelemetryPanel isOpen={isTelemetryOpen} vehicle={telemetryVehicle} />
        </div>
      </div>
    </div>
  );
}
