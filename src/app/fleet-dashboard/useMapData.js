import { useCallback, useState } from 'react';

export function useMapData() {
  const [allVehicleDetails, setAllVehicleDetails] = useState([]);
  const [categorizedPaths, setCategorizedPaths] = useState({
    cars: [], bikes: [], trucks: [], vans: [], buses: [], others: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompanyMapData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/vehicles-with-paths');

      // CORRECTED: Robust error handling
      if (!res.ok) {
        // First, get the error response as text, as it might not be JSON (e.g., HTML error page)
        const errorText = await res.text();
        try {
          // Try to parse it as JSON
          const errorJson = JSON.parse(errorText);
          // Throw the specific error message from the API, or a fallback
          throw new Error(errorJson.error || errorJson.message || 'Failed to fetch vehicle path data');
        } catch (e) {
          // If parsing failed, the error was not JSON. Throw the raw text.
          throw new Error(errorText || `Request failed with status ${res.status}`);
        }
      }
      
      const vehiclesWithPaths = await res.json();
      
      // CORRECT: This is the right place to log your data to see the array of vehicles
      console.log("Fetched vehicles with paths:", vehiclesWithPaths); 
      
      let vehicles = Array.isArray(vehiclesWithPaths) ? vehiclesWithPaths : [];

      const grouped = { cars: [], bikes: [], trucks: [], vans: [], buses: [], others: [] };

      vehicles.forEach((v, i) => {
        const id = v.imeino || v.vehicle_no || `id-${Date.now()}-${i}`;
        const type = v.vehicle_type?.toLowerCase() || '';
        
        if (type.includes('car') || type.includes('suv') || type.includes('hatchback')) {
            grouped.cars.push({ ...v, id });
        } else if (type.includes('bike')) {
            grouped.bikes.push({ ...v, id });
        } else if (type.includes('truck') || type.includes('dumper')) {
            grouped.trucks.push({ ...v, id });
        } else if (type.includes('van') || type.includes('ambulance')) {
            grouped.vans.push({ ...v, id });
        } else if (type.includes('bus')) {
            grouped.buses.push({ ...v, id });
        } else {
            grouped.others.push({ ...v, id });
        }
      });

      setAllVehicleDetails(vehicles);
      setCategorizedPaths(grouped);
    } catch (err) {
      // Set the error state so the UI can display it
      setError(err.message);
      console.error("Error in useMapData:", err); // Also log the error for debugging
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    allVehicleDetails,
    categorizedPaths,
    isLoading,
    error,
    fetchCompanyMapData
  };
}