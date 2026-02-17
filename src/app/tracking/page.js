"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MapControls from "@/components/MapControls";
import MapTypeSwitcher from "@/components/MapTypeSwitcher";
import MeasurePopup from "@/components/MeasurePopup";
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
  const [showTrafficLayer, setShowTrafficLayer] = useState(false);
  const [showLabelsLayer, setShowLabelsLayer] = useState(true);
  const [mapType, setMapType] = useState("osm");
  const [isMapTypeOpen, setIsMapTypeOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [clusterPreviewResetKey, setClusterPreviewResetKey] = useState(0);
  const [isMeasurePopupOpen, setIsMeasurePopupOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [telemetryVehicle, setTelemetryVehicle] = useState(null);
  const [geofences, setGeofences] = useState([]);
  const [geofenceError, setGeofenceError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
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

  const getFirstVisibleVehicle = useCallback(() => {
    const groupsToCheck =
      activeGroups && activeGroups.length > 0 ? activeGroups : Object.keys(groupedVehicles || {});
    for (const group of groupsToCheck) {
      const vehicles = groupedVehicles?.[group] || [];
      const found = vehicles.find(
        (v) => v && Number.isFinite(Number(v.latitude)) && Number.isFinite(Number(v.longitude))
      );
      if (found) return found;
    }
    return null;
  }, [activeGroups, groupedVehicles]);

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
        {infoMessage && (
          <div className={styles.loadingBanner}>
            {infoMessage}
            <button onClick={() => setInfoMessage(null)} className={styles.dismissErrorButton}>
              Dismiss
            </button>
          </div>
        )}
        <div className={styles.mapContainer}>
          <Tracking
            whenReady={(map) => {
              mapRef.current = map;
            }}
            mapType={mapType}
            showVehiclesLayer={showVehicles}
            showTrafficLayer={showTrafficLayer}
            showLabelsLayer={showLabelsLayer}
            vehicleData={groupedVehicles}
            activeGroups={activeGroups}
            onVehicleClick={(vehicle) => {
              setTelemetryVehicle(vehicle);
              setIsTelemetryOpen(true);
            }}
            geofences={geofences}
            onGeofenceCreated={handleGeofenceCreated}
            showBuiltInControls={false}
            userLocation={userLocation}
            forceClusterPreviewKey={clusterPreviewResetKey}
          />
          <MapControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onControlClick={(id) => {
              if (id === "send") setShowVehicles((prev) => !prev);
              if (id === "layers") setIsMapTypeOpen((prev) => !prev);
              if (id === "traffic") setShowTrafficLayer((prev) => !prev);
              if (id === "labels") setShowLabelsLayer((prev) => !prev);
              if (id === "swap") setMapType((prev) => (prev === "osm" ? "google_satellite" : "osm"));
              if (id === "measure") setIsMeasurePopupOpen(true);
              if (id === "refresh") {
                mapRef.current?.flyTo([24.8607, 67.0011], 12);
                setClusterPreviewResetKey((prev) => prev + 1);
                fetchCompanyMapData();
                fetchGeofences();
              }
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
                  () => setInfoMessage("Unable to access your location.")
                );
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
                    // ignore and overwrite below
                  }
                }
                const center = mapRef.current.getCenter?.();
                const zoom = mapRef.current.getZoom?.();
                if (!center || !Number.isFinite(zoom)) return;
                localStorage.setItem(
                  "vtp_map_favorite",
                  JSON.stringify({ lat: center.lat, lng: center.lng, zoom })
                );
                setInfoMessage("Current map view saved as favorite.");
              }
              if (id === "gps") {
                const target = telemetryVehicle || getFirstVisibleVehicle();
                if (
                  target &&
                  Number.isFinite(Number(target.latitude)) &&
                  Number.isFinite(Number(target.longitude))
                ) {
                  mapRef.current?.flyTo([Number(target.latitude), Number(target.longitude)], 16);
                } else {
                  setInfoMessage("No valid vehicle GPS data available.");
                }
              }
            }}
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
        onApply={({ distanceUnit, areaUnit }) =>
          setInfoMessage(`Measurement set: Distance ${distanceUnit || "N/A"}, Area ${areaUnit || "N/A"}`)
        }
      />
    </div>
  );
}
