"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { FaBars } from "react-icons/fa";
import styles from "@/app/page.module.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MapControls from "@/components/MapControls";
import MapTypeSwitcher from "@/components/MapTypeSwitcher";
import MeasurePopup from "@/components/MeasurePopup";
import TelemetryPanel from "@/components/TelemetryPanel";
import { useAuth } from "@/app/fleet-dashboard/useAuth";
import { useMapData } from "@/app/fleet-dashboard/useMapData";

const MapComponentWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => null,
});

export default function DashboardPage() {
  const SIDEBAR_WIDTH = 70;
  const mapRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isMeasurePopupOpen, setIsMeasurePopupOpen] = useState(false);
  const [telemetryVehicle, setTelemetryVehicle] = useState(null);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showTrafficLayer, setShowTrafficLayer] = useState(false);
  const [showLabelsLayer, setShowLabelsLayer] = useState(true);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapType, setMapType] = useState("osm");
  const [isMapTypeOpen, setIsMapTypeOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [clusterPreviewResetKey, setClusterPreviewResetKey] = useState(0);
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
    if (authChecked && isAuthenticated) {
      fetchGeofences();
    }
  }, [authChecked, isAuthenticated, fetchGeofences]);

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
    setIsMapReady(true);
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

  const getFirstVisibleVehicle = useCallback(() => {
    const groupsToCheck =
      activeGroups && activeGroups.length > 0 ? activeGroups : Object.keys(groupedVehicles || {});
    for (const group of groupsToCheck) {
      const vehicles = groupedVehicles?.[group] || [];
      const found = vehicles.find(
        (v) =>
          v &&
          Number.isFinite(Number(v.latitude)) &&
          Number.isFinite(Number(v.longitude))
      );
      if (found) return found;
    }
    return null;
  }, [activeGroups, groupedVehicles]);

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
    if (id === "locate") {
      if (!navigator.geolocation || !mapRef.current) return;
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setUserLocation({
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            updatedAt: Date.now(),
          });
          mapRef.current?.flyTo([coords.latitude, coords.longitude], 16);
        },
        () => setSearchError("Unable to access your location.")
      );
      return;
    }

    if (id === "favorites") {
      if (!mapRef.current) return;
      const saved = localStorage.getItem("vtp_map_favorite");
      if (saved) {
        try {
          const fav = JSON.parse(saved);
          if (Number.isFinite(fav?.lat) && Number.isFinite(fav?.lng) && Number.isFinite(fav?.zoom)) {
            mapRef.current.flyTo([fav.lat, fav.lng], fav.zoom);
            return;
          }
        } catch {
          // ignore invalid favorite and overwrite below
        }
      }
      const center = mapRef.current.getCenter?.();
      const zoom = mapRef.current.getZoom?.();
      if (!center || !Number.isFinite(zoom)) return;
      localStorage.setItem(
        "vtp_map_favorite",
        JSON.stringify({ lat: center.lat, lng: center.lng, zoom })
      );
      setSearchError('Current map view saved as favorite. Tap star again to jump.');
      return;
    }

    if (id === "layers") {
      setIsMapTypeOpen((prev) => !prev);
      return;
    }

    if (id === "traffic") {
      setShowTrafficLayer((prev) => !prev);
      return;
    }

    if (id === "send") {
      setShowVehicles((prev) => !prev);
      return;
    }

    if (id === "gps") {
      if (!mapRef.current) return;
      const target = telemetryVehicle || getFirstVisibleVehicle();
      if (
        target &&
        Number.isFinite(Number(target.latitude)) &&
        Number.isFinite(Number(target.longitude))
      ) {
        mapRef.current.flyTo([Number(target.latitude), Number(target.longitude)], 16);
      } else {
        setSearchError("No valid vehicle GPS data available.");
      }
      return;
    }

    if (id === "measure") {
      setIsMeasurePopupOpen(true);
      return;
    }

    if (id === "labels") {
      setShowLabelsLayer((prev) => !prev);
      return;
    }

    if (id === "refresh") {
      mapRef.current?.flyTo([24.8607, 67.0011], 12);
      setClusterPreviewResetKey((prev) => prev + 1);
      fetchCompanyMapData();
      fetchGeofences();
      return;
    }

    if (id === "swap") {
      setMapType((prev) => (prev === "osm" ? "google_satellite" : "osm"));
    }
  };

  const loadingMessage =
    !authChecked
      ? "Checking authentication..."
      : !isAuthenticated
      ? "Redirecting to login..."
      : !isMapReady
      ? "Loading Map..."
      : isLoading && !Object.keys(groupedVehicles).length
      ? "Loading vehicle data..."
      : null;

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
      <div
        className={styles.contentArea}
        style={{ marginLeft: isSidebarOpen ? `${SIDEBAR_WIDTH}px` : "0" }}
      >
        {searchError && (
          <div className={styles.searchErrorBanner}>
            {searchError}{" "}
            <button onClick={() => setSearchError(null)} className={styles.dismissErrorButton}>
              &times;
            </button>
          </div>
        )}
        {loadingMessage && <div className={styles.loadingBanner}>{loadingMessage}</div>}
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
            mapType={mapType}
            showVehiclesLayer={showVehicles}
            showTrafficLayer={showTrafficLayer}
            showLabelsLayer={showLabelsLayer}
            vehicleData={groupedVehicles}
            activeGroups={activeGroups}
            onVehicleClick={handleVehicleClick}
            geofences={geofences}
            onGeofenceCreated={handleGeofenceCreated}
            showBuiltInControls={false}
            userLocation={userLocation}
            forceClusterPreviewKey={clusterPreviewResetKey}
          />
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onControlClick={handleMapControlClick}
            isPanelOpen={isTelemetryOpen}
            canCloseTelemetry={isTelemetryOpen && !!telemetryVehicle}
            onCloseTelemetry={() => setIsTelemetryOpen(false)}
          />
          <MapTypeSwitcher
            isOpen={isMapTypeOpen}
            mapType={mapType}
            onSelect={(type) => {
              setMapType(type);
              setIsMapTypeOpen(false);
            }}
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
