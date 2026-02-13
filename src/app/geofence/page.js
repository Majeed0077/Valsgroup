"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapComponentWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div style={{ padding: "12px" }}>Loading map...</div>,
});

export default function GeofencePage() {
  const [geofences, setGeofences] = useState([]);
  const [geofenceError, setGeofenceError] = useState(null);

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

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {geofenceError && (
        <div style={{ padding: "8px 12px", background: "#ffe5e5", color: "#9f1717" }}>
          Geofence Error: {geofenceError}
        </div>
      )}
      <div style={{ height: geofenceError ? "calc(100vh - 40px)" : "100vh", width: "100%" }}>
        <MapComponentWithNoSSR geofences={geofences} onGeofenceCreated={handleGeofenceCreated} />
      </div>
    </div>
  );
}
