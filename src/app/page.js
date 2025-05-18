'use client'; // This directive MUST be at the very top to mark it as a Client Component.

// --- React and Next.js Imports ---
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// --- Component Imports ---
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MapControls from '@/components/MapControls';
import MeasurePopup from '@/components/MeasurePopup';
import InfoPanel from '@/components/InfoPanel';

// --- Styles and Icons ---
import styles from './page.module.css';
import { FaBars } from 'react-icons/fa';

// --- Dynamically Import Map Component ---
const MapComponentWithNoSSR = dynamic(
  () => import('@/components/MapComponent'),
  { ssr: false }
);

// --- Helper function to transform API data for InfoPanel ---
const transformVehicleDataForInfoPanel = (apiData) => {
  if (!apiData || typeof apiData !== 'object') {
    // console.warn("[transformVehicleDataForInfoPanel] Invalid or empty API data received.");
    return null;
  }

  const getVehicleImage = (type) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('truck') || typeLower.includes('mixer') || typeLower.includes('handler') || typeLower.includes('dumper') || typeLower.includes('trailer') || typeLower.includes('ecomet')) return '/icons/truck.png';
    if (typeLower.includes('car') || typeLower.includes('suv') || typeLower.includes('muv') || typeLower.includes('hatchback') || typeLower.includes('mercedes')) return '/icons/car.png';
    if (typeLower.includes('bike') || typeLower.includes('motorcycle')) return '/icons/bike.png';
    if (typeLower.includes('ambulance')) return '/icons/ambulance.png';
    if (typeLower.includes('van') || typeLower.includes('tempo') || typeLower.includes('campervan')) return '/icons/van.png';
    if (typeLower.includes('bus')) return '/icons/bus.png';
    if (typeLower.includes('rickshaw')) return '/iconbs/rickshaw.png';
    if (typeLower.includes('hot air ballon') || typeLower.includes('hotairballon')) return '/icons/hotairballoon.png';
    if (typeLower.includes('default')) return '/icons/default-vehicle.png';
    return '/icons/placeholder-suv.png';
  };

  let driverName = "N/A";
  if (apiData.driver_first_name && apiData.driver_first_name !== "--" && apiData.driver_last_name && apiData.driver_last_name !== "--") {
    driverName = `${apiData.driver_first_name} ${apiData.driver_last_name}`.trim();
  } else if (apiData.driver_first_name && apiData.driver_first_name !== "--") {
    driverName = apiData.driver_first_name;
  }
  if (driverName === "-- --" || driverName === "--") driverName = "N/A";

  return {
    vehicleType: apiData.vehicle_type || "N/A",
    vehicleImage: getVehicleImage(apiData.vehicle_type),
    plate: apiData.vehicle_no || apiData.vehicle_reg_no || "N/A",
    status: apiData.status || "N/A",
    tripDistance: apiData.trip_distance !== undefined ? parseFloat(apiData.trip_distance).toFixed(2) : "N/A",
    odometer: apiData.odometer !== undefined ? String(apiData.odometer).padStart(7, '0') : "N/A",
    driver: driverName,
    mobile: apiData.driver_mobile || "N/A",
    location: (apiData.latitude && apiData.longitude)
      ? `${parseFloat(apiData.latitude).toFixed(6)}, ${parseFloat(apiData.longitude).toFixed(6)}`
      : "N/A",
    address: apiData.location || "N/A",
    geofence: apiData.geofence_name || "N/A",

    runningTime: apiData.running_time || "N/A",
    stopTime: apiData.stop_time || "N/A",
    idleTime: apiData.idle_time || "N/A",
    inactiveTime: apiData.inactive_time || "N/A",
    workHour: apiData.work_hour || "N/A",

    currentSpeed: apiData.speed !== undefined ? String(apiData.speed) : "N/A",
    averageSpeed: apiData.average_speed !== undefined ? String(apiData.average_speed) : "N/A",
    maxSpeed: apiData.max_speed !== undefined ? String(apiData.max_speed) : "N/A",
    speedLimit: apiData.speed_limit !== undefined ? String(apiData.speed_limit) : "N/A",

    imeino: apiData.imeino,
    device_model: apiData.device_model,
    external_volt: apiData.external_volt,
    direction: apiData.direction,
    angle: apiData.angle,
    gps_time: apiData.gps_time,
    servertime: apiData.servertime,
  };
};

// --- Main Page Component Definition ---
export default function Home() {
  // --- State Variables ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const mapRef = useRef(null);
  const [showVehicles, setShowVehicles] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isMeasurePopupOpen, setIsMeasurePopupOpen] = useState(false);
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(false);

  const [selectedVehicleData, setSelectedVehicleData] = useState(null);
  const [allVehicleDetails, setAllVehicleDetails] = useState([]);

  const [currentVehicleDataSet, setCurrentVehicleDataSet] = useState({});
  const previousVehicleDataSetRef = useRef({});

  const [isLoadingPaths, setIsLoadingPaths] = useState(true);
  const [pathError, setPathError] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let loggedIn = false;
    try {
      // Accessing sessionStorage is a client-side operation.
      // This is fine now because the component is marked 'use client'.
      loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    } catch (e) { console.error("Could not read sessionStorage:", e); }
    setIsAuthenticated(loggedIn);
    setAuthChecked(true);
    if (!loggedIn) {
      router.replace('/login');
    }
  }, [router]);

  // --- Fetch Company Map Data ---
  const fetchCompanyMapData = useCallback(async () => {
    // console.log("[Page.js] fetchCompanyMapData called");
    setPathError(null);

    try {
      const companyId = "Shah%20Jee%20Transport";
      const apiRouteUrl = `/api/mapview?company=${encodeURIComponent(companyId)}`;
      const response = await fetch(apiRouteUrl);

      if (!response.ok) {
        let errorBodyText = await response.text();
        console.error(`[Page.js fetchCompanyMapData] API Error ${response.status}: ${errorBodyText.substring(0, 500)}`);
        throw new Error(`API Error ${response.status}: ${errorBodyText.substring(0, 200)}`);
      }

      const apiResponseData = await response.json();
      // console.log("[Page.js fetchCompanyMapData] API Response:", apiResponseData);

      let vehicleDataArray = [];

      if (apiResponseData && typeof apiResponseData === 'object') {
        if (Array.isArray(apiResponseData)) {
          vehicleDataArray = apiResponseData;
        } else if (apiResponseData.data && Array.isArray(apiResponseData.data)) {
          vehicleDataArray = apiResponseData.data;
        } else if (apiResponseData.vehicles && Array.isArray(apiResponseData.vehicles)) {
          vehicleDataArray = apiResponseData.vehicles;
        } else if ((typeof apiResponseData.latitude === 'number' || typeof apiResponseData.latitude === 'string') &&
          (typeof apiResponseData.longitude === 'number' || typeof apiResponseData.longitude === 'string') &&
          typeof apiResponseData.vehicle_type === 'string') {
          vehicleDataArray = [apiResponseData];
        } else {
          console.warn("[Page.js fetchCompanyMapData] Unexpected API response structure. Not an array or known single object:", apiResponseData);
          vehicleDataArray = [];
        }
      } else {
        console.warn("[Page.js fetchCompanyMapData] API response is not a valid object or array:", apiResponseData);
        setPathError("Unexpected API response format from /mapview.");
        setCurrentVehicleDataSet(prev => {
          previousVehicleDataSetRef.current = prev;
          return {};
        });
        setAllVehicleDetails([]);
        return;
      }

      setAllVehicleDetails(vehicleDataArray);

      const newCategorizedVehicles = {
        cars: [], bikes: [], trucks: [], vans: [], buses: [], others: []
      };

      if (vehicleDataArray.length > 0) {
        vehicleDataArray.forEach((vehicle, index) => {
          if (!vehicle || typeof vehicle !== 'object') {
            // console.warn(`[Page.js] Skipping invalid vehicle item at index ${index}:`, vehicle);
            return;
          }

          const vehicleId = vehicle.imeino || vehicle.vehicle_no || vehicle.id || `vehicle-${Date.now()}-${index}`;
          const lat = parseFloat(String(vehicle.latitude));
          const lng = parseFloat(String(vehicle.longitude));

          if (isNaN(lat) || isNaN(lng)) {
            // console.warn(`[Page.js] Invalid lat/lng for vehicle ID ${vehicleId}: Lat: ${vehicle.latitude}, Lng: ${vehicle.longitude}`);
            return;
          }

          const vehicleWithProcessedCoords = {
            ...vehicle,
            id: vehicleId,
            latitude: lat,
            longitude: lng
          };

          const typeFromVehicle = vehicle.vehicle_type ? vehicle.vehicle_type.toLowerCase() : 'default';

          if (typeFromVehicle.includes('car') || typeFromVehicle.includes('suv') || typeFromVehicle.includes('muv') || typeFromVehicle.includes('hatchback') || typeFromVehicle === 'mercedes') {
            newCategorizedVehicles.cars.push(vehicleWithProcessedCoords);
          } else if (typeFromVehicle.includes('bike') || typeFromVehicle.includes('motorcycle')) {
            newCategorizedVehicles.bikes.push(vehicleWithProcessedCoords);
          } else if (typeFromVehicle.includes('truck') || typeFromVehicle.includes('mixer') || typeFromVehicle.includes('handler') || typeFromVehicle.includes('telescopichandler') || typeFromVehicle.includes('dumper') || typeFromVehicle.includes('trailer') || typeFromVehicle.includes('ecomet')) {
            newCategorizedVehicles.trucks.push(vehicleWithProcessedCoords);
          } else if (typeFromVehicle.includes('ambulance')) {
            newCategorizedVehicles.vans.push(vehicleWithProcessedCoords);
          } else if (typeFromVehicle.includes('van') || typeFromVehicle.includes('tempo') || typeFromVehicle.includes('campervan')) {
            newCategorizedVehicles.vans.push(vehicleWithProcessedCoords);
          } else if (typeFromVehicle.includes('bus')) {
            newCategorizedVehicles.buses.push(vehicleWithProcessedCoords);
          } else if (typeFromVehicle.includes('rickshaw') || typeFromVehicle.includes('hot air ballon') || typeFromVehicle.includes('hotairballon') || typeFromVehicle.includes('default')) {
            newCategorizedVehicles.others.push(vehicleWithProcessedCoords);
          } else {
            // console.warn(`[Page.js] Unhandled vehicle_type: '${vehicle.vehicle_type}' for vehicle ID ${vehicleId}. Categorizing as 'Other'.`);
            newCategorizedVehicles.others.push(vehicleWithProcessedCoords);
          }
        });
      }

      setCurrentVehicleDataSet(prevCurrentVehicles => {
        previousVehicleDataSetRef.current = prevCurrentVehicles;
        return newCategorizedVehicles;
      });

      setPathError(null);
      // console.log(`[Page.js] Data fetched. New set has ${newCategorizedVehicles.cars.length} cars.`);

    } catch (error) {
      console.error('[Page.js fetchCompanyMapData] Error:', error);
      setPathError(`Failed to load data: ${error.message}`);
      setAllVehicleDetails([]);
    } finally {
      setIsLoadingPaths(false);
    }
  }, []); // No dependencies needed for fetchCompanyMapData itself, it's stable.

  // --- Data Fetching Interval ---
  useEffect(() => {
    let intervalId = null;
    if (authChecked && isAuthenticated) {
      // console.log("[Page.js] Auth confirmed, starting data fetch interval.");
      setIsLoadingPaths(true);
      fetchCompanyMapData(); // Initial fetch

      const FETCH_INTERVAL = 20000; // Fetch every 20 seconds
      intervalId = setInterval(() => {
        // console.log("[Page.js] Interval: calling fetchCompanyMapData");
        fetchCompanyMapData();
      }, FETCH_INTERVAL);
      console.log(`[Page.js] Data fetching interval (every ${FETCH_INTERVAL / 1000}s) started for /api/mapview.`);
    } else if (authChecked && !isAuthenticated) {
        console.log("[Page.js] User not authenticated, data fetching not initiated.");
        setIsLoadingPaths(false);
        setCurrentVehicleDataSet(prev => {
            previousVehicleDataSetRef.current = prev;
            return {};
        });
        setAllVehicleDetails([]);
        setPathError(null);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("[Page.js] Data fetching interval cleared.");
      }
    };
  }, [isAuthenticated, authChecked, fetchCompanyMapData]); // fetchCompanyMapData is stable due to useCallback

  const handleMapReady = (mapInstance) => { mapRef.current = mapInstance; };
  const handleZoomIn = () => { mapRef.current?.zoomIn(); };
  const handleZoomOut = () => { mapRef.current?.zoomOut(); };
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
    setTimeout(() => mapRef.current?.invalidateSize(), 300); // invalidateSize is a Leaflet method
  };

  const handleSearch = async (term) => {
    if (!term?.trim()) { setSearchError("Please enter a location to search."); return; }
    if (!mapRef.current) { setSearchError("Map is not ready yet."); return; }
    setIsSearching(true);
    setSearchError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Nominatim search failed with status: ${response.status}`);
      const data = await response.json();
      if (data?.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 15); // flyTo is a Leaflet method
        setSearchError(null);
      } else {
        setSearchError(`Location "${term}" not found.`);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(`Search error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleVehicleDisplay = () => setShowVehicles(prev => !prev);

  const handleMapControlClick = (id) => {
    if (id === 'send') { toggleVehicleDisplay(); }
    else if (id === 'measure') { setIsMeasurePopupOpen(true); }
    else if (id === 'infoPanel') {
      if (allVehicleDetails.length > 0) {
        setSelectedVehicleData(transformVehicleDataForInfoPanel(allVehicleDetails[0]));
        setIsInfoPanelVisible(true);
      } else {
        alert("No vehicle data available for Info Panel.");
      }
    }
  };

  const closeMeasurePopup = () => setIsMeasurePopupOpen(false);
  const handleApplyMeasureSettings = (settings) => {
    console.log("Applying measure settings:", settings);
    closeMeasurePopup();
  };
  const closeInfoPanel = () => setIsInfoPanelVisible(false);

  if (!authChecked) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Checking authentication...</div>;
  // No need to explicitly return for !isAuthenticated here if router.replace handles it,
  // but it's good for clarity or if redirection takes a moment.
  if (!isAuthenticated && authChecked) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Redirecting to login...</div>;

  // If not authenticated and auth is checked, the useEffect will redirect.
  // If still not authenticated at this point (e.g., redirect hasn't happened yet or failed silently),
  // it might be good to prevent rendering the main UI.
  // However, the redirect should ideally handle this.
  // Let's assume the redirect in useEffect is sufficient.

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} activeItem={activeNavItem} setActiveItem={setActiveNavItem} />
      {!isSidebarOpen && (
        <button className={styles.openSidebarButton} onClick={toggleSidebar} title="Open Sidebar">
          <FaBars size={20} />
        </button>
      )}
      <Header onSearch={handleSearch} isSearching={isSearching} />

      <div className={styles.contentArea} style={{ marginLeft: isSidebarOpen ? '260px' : '0' }}>
        {searchError && <div className={styles.searchErrorBanner}>{searchError}<button onClick={() => setSearchError(null)} className={styles.dismissErrorButton}>×</button></div>}
        {isLoadingPaths && <div className={styles.loadingBanner}>Loading vehicle data...</div>}
        {pathError && !isLoadingPaths && <div className={styles.errorBanner}>{pathError}<button onClick={() => { setPathError(null); setIsLoadingPaths(true); fetchCompanyMapData(); }} className={styles.dismissErrorButton}>Retry</button></div>}

        <div className={styles.mapContainer}>
          <MapComponentWithNoSSR
            whenReady={handleMapReady}
            showVehiclesLayer={showVehicles}
            currentVehicles={currentVehicleDataSet}
            previousVehicles={previousVehicleDataSetRef.current}
            animationDuration={19500} // Animate over 19.5 seconds
            onVehicleClick={(vehicleApiData) => {
              setSelectedVehicleData(transformVehicleDataForInfoPanel(vehicleApiData));
              setIsInfoPanelVisible(true);
            }}
          />
          <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onControlClick={handleMapControlClick} />
        </div>
      </div>

      <MeasurePopup isOpen={isMeasurePopupOpen} onClose={closeMeasurePopup} onApply={handleApplyMeasureSettings} />

      <InfoPanel
        isVisible={isInfoPanelVisible}
        onClose={closeInfoPanel}
        data={selectedVehicleData}
      />
    </>
  );
}