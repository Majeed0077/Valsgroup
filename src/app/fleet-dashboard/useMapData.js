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

  const fallbackVehicles = [
    {
      imei_id: "DUMMY-001",
      vehicle_no: "DUMMY-001",
      vehicle_type: "Car",
      latitude: 24.8644,
      longitude: 67.0723,
      speed: 20,
      movement_status: "RUNNING",
    },
    {
      imei_id: "DUMMY-002",
      vehicle_no: "DUMMY-002",
      vehicle_type: "Truck",
      latitude: 24.8607,
      longitude: 67.0011,
      speed: 0,
      movement_status: "STOP",
    },
    {
      imei_id: "DUMMY-003",
      vehicle_no: "DUMMY-003",
      vehicle_type: "Bike",
      latitude: 24.9306,
      longitude: 67.0892,
      speed: 35,
      movement_status: "RUNNING",
    },
  ];

  const buildGroups = (vehicles) => {
    const groups = {
      "Live & Moving": [],
      Parked: [],
      "Offline/Other": [],
    };

    vehicles.forEach((vehicle) => {
      const vehicleWithId = { ...vehicle, id: vehicle.imei_id };
      if (vehicle.speed > 0) {
        groups["Live & Moving"].push(vehicleWithId);
      } else if (vehicle.speed === 0) {
        groups.Parked.push(vehicleWithId);
      } else {
        groups["Offline/Other"].push(vehicleWithId);
      }
    });

    return groups;
  };

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

      const sourceVehicles =
        normalizedVehicles.length > 0 ? normalizedVehicles : fallbackVehicles;

      setAllVehicles(sourceVehicles);
      setGroupedVehicles(buildGroups(sourceVehicles));
      hasLoadedRef.current = true;

    } catch (err) {
      // Set the error state so the UI can display it
      setError(err.message);
      setAllVehicles(fallbackVehicles);
      setGroupedVehicles(buildGroups(fallbackVehicles));
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
