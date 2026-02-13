// src/app/fleet-dashboard/useMapData.js
import { useCallback, useRef, useState } from 'react';

/**
 * A custom hook to fetch and process vehicle data for the map dashboard.
 * It fetches the master list from the API and categorizes vehicles into
 * operational groups (e.g., 'Live & Moving', 'Parked') for UI filtering.
 */
export function useMapData() {
  // State to hold the raw, unfiltered list of all vehicles from the API
  const [allVehicles, setAllVehicles] = useState([]);
  
  // State to hold vehicles categorized by their status for the UI
  const [groupedVehicles, setGroupedVehicles] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  const fetchCompanyMapData = useCallback(async () => {
    setError(null);
    setIsLoading(!hasLoadedRef.current);
    setIsRefreshing(hasLoadedRef.current);
    try {
      const res = await fetch('/api/vehicles-with-paths');

      // Robust error handling for the fetch response
      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || 'Failed to fetch vehicle path data');
        } catch (e) {
          throw new Error(errorText || `Request failed with status ${res.status}`);
        }
      }
      
      const vehiclesFromApi = await res.json();
      
      const vehicles = Array.isArray(vehiclesFromApi) ? vehiclesFromApi : [];
      const normalizedVehicles = vehicles
        .map((vehicle) => {
          const latitude = Number(vehicle.latitude);
          const longitude = Number(vehicle.longitude);
          const speed = Number(vehicle.speed);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return {
            ...vehicle,
            imei_id: String(vehicle.imei_id ?? ""),
            latitude,
            longitude,
            speed: Number.isFinite(speed) ? speed : -1,
          };
        })
        .filter(Boolean);

      // --- NEW GROUPING LOGIC ---
      // This logic categorizes vehicles by status, which is what the UI needs.
      const groups = {
        'Live & Moving': [],
        'Parked': [],
        'Offline/Other': []
      };

      normalizedVehicles.forEach(vehicle => {
        // --- CORRECTION: USE imei_id as the unique ID ---
        // Ensure each vehicle object has a unique `id` prop for React keys.
        const vehicleWithId = { ...vehicle, id: vehicle.imei_id }; 
        
        // --- Grouping by operational status ---
        // This logic can be customized to your specific business rules.
        if (vehicle.speed > 0) {
            groups['Live & Moving'].push(vehicleWithId);
        } else if (vehicle.speed === 0) {
            groups['Parked'].push(vehicleWithId);
        } else {
            // Catch-all for vehicles that might be offline or have no data
            groups['Offline/Other'].push(vehicleWithId);
        }
      });

      setAllVehicles(normalizedVehicles); // Store the raw, complete list
      setGroupedVehicles(groups); // Store the data categorized for the UI
      hasLoadedRef.current = true;

    } catch (err) {
      // Set the error state so the UI can display it
      setError(err.message);
      console.error("Error in useMapData hook:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  return {
    allVehicles,      // The full, unprocessed list of vehicles
    groupedVehicles,  // The categorized object for your UI (e.g., sidebar)
    isLoading,
    isRefreshing,
    error,
    fetchCompanyMapData
  };
}
