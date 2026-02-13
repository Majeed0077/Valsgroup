"use client";

import React, { useEffect, useRef, useState } from "react";
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
  const mapRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeGroups, setActiveGroups] = useState([]);
  const [showVehicles, setShowVehicles] = useState(true);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(true);
  const [telemetryVehicle, setTelemetryVehicle] = useState(null);
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

  if (!authChecked || !isAuthenticated) return null;

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Header />
      <div className={styles.contentArea} style={{ marginLeft: isSidebarOpen ? "100px" : "0" }}>
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
