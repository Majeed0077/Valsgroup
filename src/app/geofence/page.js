"use client";

import React from "react";
// import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {

   const [geofences, setGeofences] = useState([]);
  const [isFetchingGeofences, setIsFetchingGeofences] = useState(false);
  const [geofenceError, setGeofenceError] = useState(null);

 const fetchGeofences = useCallback(async () => {
    setIsFetchingGeofences(true);
    setGeofenceError(null);
    try {
        const response = await fetch('/api/geofences'); // Fetch from our new API route
        if (!response.ok) throw new Error("Failed to fetch geofences");
        const data = await response.json();
        setGeofences(data);
    } catch (error) {
        console.error("Geofence fetch error:", error);
        setGeofenceError(error.message);
    } finally {
        setIsFetchingGeofences(false);
    }
  }, []);

  // Fetch geofences on initial load
  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  // --- NEW HANDLER for when a geofence is drawn on the map ---
  const handleGeofenceCreated = useCallback(async (geofenceShape) => {
    // Prompt user for a name
    const name = prompt("Please enter a name for the new geofence:");
    if (!name) {
        alert("Geofence creation cancelled.");
        return;
    }

    const newGeofencePayload = {
        name: name,
        type: geofenceShape.type,
        data: geofenceShape.data,
        company: 'default_company', // Get this from user auth context later
    };

    try {
        const response = await fetch('/api/geofences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGeofencePayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to save geofence");
        }
        alert("Geofence saved successfully!");
        // Refetch all geofences to display the new one
        fetchGeofences();

    } catch (error) {
        console.error("Error saving geofence:", error);
        alert(`Error saving geofence: ${error.message}`);
    }
  }, [fetchGeofences]); 


  return (
    <div style={{ height: "100vh", overflowY: "auto", padding: "20px" }}>
  {/* ... (Your existing Sidebar, Header, etc.) ... */}
   <Dashboard />
      <div className={styles.contentArea} style={{ marginLeft: isSidebarOpen ? "260px" : "0"
}}>
        {/* ... (Your existing banners for search errors, data loading, etc.) ... */}
        {geofenceError && <div className={styles.errorBanner}>Geofence Error: {geofenceError}</div>}
        
        <div className={styles.mapContainer}>
          <MapComponentWithNoSSR
            // ... (Your existing props: whenReady, showVehiclesLayer, vehicleData, etc.) ...

            // --- NEW PROPS FOR GEOFENCE ---
            geofences={geofences}
            onGeofenceCreated={handleGeofenceCreated}
          />
          {/* ... (Your existing MapControls, etc.) ... */}
        </div>
      </div>
    </div>
  );
}
