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
      const res = await fetch('/api/mapview?company=ooo');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      let vehicles = Array.isArray(data) ? data : data?.vehicles || data?.data || [];
      const grouped = { cars: [], bikes: [], trucks: [], vans: [], buses: [], others: [] };

      vehicles.forEach((v, i) => {
        const id = v.imeino || v.vehicle_no || `id-${Date.now()}-${i}`;
        const type = v.vehicle_type?.toLowerCase() || '';
        const group = grouped;
        if (type.includes('car') || type.includes('suv') || type.includes('hatchback')) group.cars.push({ ...v, id });
        else if (type.includes('bike')) group.bikes.push({ ...v, id });
        else if (type.includes('truck') || type.includes('dumper')) group.trucks.push({ ...v, id });
        else if (type.includes('van') || type.includes('ambulance')) group.vans.push({ ...v, id });
        else if (type.includes('bus')) group.buses.push({ ...v, id });
        else group.others.push({ ...v, id });
      });

      setAllVehicleDetails(vehicles);
      setCategorizedPaths(grouped);
    } catch (err) {
      setError(err.message);
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
