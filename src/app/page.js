"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { FaBars } from "react-icons/fa";
import styles from "@/app/page.module.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MapControls from "@/components/MapControls";
import MeasurePopup from "@/components/MeasurePopup";
import TelemetryPanel from "@/components/TelemetryPanel";
import { useAuth } from "@/app/fleet-dashboard/useAuth";
import { useMapData } from "@/app/fleet-dashboard/useMapData";

const MapComponentWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className={styles.mapLoadingOverlay}>Loading Map...</div>,
});

export default function DashboardPage() {
  const mapRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isMeasurePopupOpen, setIsMeasurePopupOpen] = useState(false);
  const [telemetryVehicle, setTelemetryVehicle] = useState(null);
  const [showVehicles, setShowVehicles] = useState(true);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [geofences, setGeofences] = useState([]);
  const [geofenceError, setGeofenceError] = useState(null);

  const { authChecked, isAuthenticated } = useAuth();
  const { groupedVehicles, isLoading, error, fetchCompanyMapData } = useMapData();
  const [activeGroups, setActiveGroups] = useState([]);

  useEffect(() => {
    const triggerBackgroundSync = async () => {
      try {
        await fetch("/api/sync-external-data");
      } catch (err) {
        console.error("Error triggering background sync:", err);
      }
    };

    const refreshUIData = () => {
      if (authChecked && isAuthenticated) {
        fetchCompanyMapData();
      }
    };

    triggerBackgroundSync();
    refreshUIData();

    const syncInterval = setInterval(triggerBackgroundSync, 60000);
    const fetchInterval = setInterval(refreshUIData, 15000);

    return () => {
      clearInterval(syncInterval);
      clearInterval(fetchInterval);
    };
  }, [authChecked, isAuthenticated, fetchCompanyMapData]);

  useEffect(() => {
    if (Object.keys(groupedVehicles).length > 0 && activeGroups.length === 0) {
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

  const handleMapReady = (mapInstance) => {
    mapRef.current = mapInstance;
  };
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleVehicleClick = (vehicle) => {
    setTelemetryVehicle(vehicle);
    setIsTelemetryOpen(true);
  };

  const handleVehicleSelectFromSidebar = (vehicle) => {
    handleVehicleClick(vehicle);
    if (mapRef.current) {
      mapRef.current.flyTo([vehicle.latitude, vehicle.longitude], 16);
    }
  };

  const handleSearch = async (term) => {
    if (!term?.trim()) return setSearchError("Please enter a location.");
    if (!mapRef.current) return setSearchError("Map not ready.");

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1`
      );
      const data = await res.json();
      if (data?.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 15);
      } else {
        setSearchError(`Location "${term}" not found.`);
      }
    } catch (err) {
      setSearchError(`Search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapControlClick = (id) => {
    if (id === "toggleSidebar") setIsTelemetryOpen((prev) => !prev);
    if (id === "send") setShowVehicles((prev) => !prev);
    if (id === "measure") setIsMeasurePopupOpen(true);
  };

  if (!authChecked) return <div className={styles.fullScreenState}>Checking authentication...</div>;
  if (!isAuthenticated) return <div className={styles.fullScreenState}>Redirecting to login...</div>;

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeItem={activeNavItem}
        setActiveItem={setActiveNavItem}
        vehicleGroups={groupedVehicles}
        activeGroups={activeGroups}
        setActiveGroups={setActiveGroups}
        onVehicleSelect={handleVehicleSelectFromSidebar}
        isLoading={isLoading}
      />
      {!isSidebarOpen && (
        <button className={styles.openSidebarButton} onClick={toggleSidebar} title="Open Sidebar">
          <FaBars size={20} />
        </button>
      )}
      <Header onSearch={handleSearch} isSearching={isSearching} />
      <div className={styles.contentArea} style={{ marginLeft: isSidebarOpen ? "100px" : "0" }}>
        {searchError && (
          <div className={styles.searchErrorBanner}>
            {searchError}{" "}
            <button onClick={() => setSearchError(null)} className={styles.dismissErrorButton}>
              &times;
            </button>
          </div>
        )}
        {isLoading && !Object.keys(groupedVehicles).length && (
          <div className={styles.loadingBanner}>Loading vehicle data...</div>
        )}
        {error && (
          <div className={styles.errorBanner}>
            {error}{" "}
            <button onClick={() => fetchCompanyMapData()} className={styles.dismissErrorButton}>
              Retry
            </button>
          </div>
        )}
        {geofenceError && (
          <div className={styles.errorBanner}>
            Geofence Error: {geofenceError}{" "}
            <button onClick={() => setGeofenceError(null)} className={styles.dismissErrorButton}>
              Dismiss
            </button>
          </div>
        )}

        <div className={styles.mapContainer}>
          <MapComponentWithNoSSR
            whenReady={handleMapReady}
            showVehiclesLayer={showVehicles}
            vehicleData={groupedVehicles}
            activeGroups={activeGroups}
            onVehicleClick={handleVehicleClick}
            geofences={geofences}
            onGeofenceCreated={handleGeofenceCreated}
            showBuiltInControls={false}
          />
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onControlClick={handleMapControlClick}
            isPanelOpen={isTelemetryOpen}
          />
          <TelemetryPanel isOpen={isTelemetryOpen} vehicle={telemetryVehicle} />
        </div>
      </div>
      <MeasurePopup
        isOpen={isMeasurePopupOpen}
        onClose={() => setIsMeasurePopupOpen(false)}
        onApply={() => {}}
      />
    </>
  );
}
