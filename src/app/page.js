// src/app/page.js
'use client';

// --- React and Next.js Imports ---
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// --- Component Imports ---
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MapControls from '@/components/MapControls';
import MeasurePopup from '@/components/MeasurePopup';
import InfoPanel from '@/components/InfoPanel'; // Ensure this path is correct

// --- Styles and Icons ---
import styles from './page.module.css'; // Ensure this path is correct
import { FaBars } from 'react-icons/fa';

// --- Dynamically Import Map Component ---
const MapComponentWithNoSSR = dynamic(
  () => import('@/components/MapComponent'), // Ensure this path is correct
  { ssr: false }
);

// --- Helper function to transform API data for InfoPanel ---
const transformVehicleDataForInfoPanel = (apiData) => {
  if (!apiData || typeof apiData !== 'object') {
    console.warn("[transformVehicleDataForInfoPanel] Invalid or empty API data received.");
    return null;
  }

  const getVehicleImage = (type) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('truck')) return '/icons/truck.png';
    if (typeLower.includes('car') || typeLower.includes('suv') || typeLower.includes('muv')) return '/icons/car.png';
    if (typeLower.includes('bike') || typeLower.includes('motorcycle')) return '/icons/bike.png';
    if (typeLower.includes('van') || typeLower.includes('tempo') || typeLower.includes('campervan')) return '/icons/van.png'; // Added van types
    if (typeLower.includes('bus')) return '/icons/bus.png'; // Added bus
    if (typeLower.includes('default')) return '/icons/default-vehicle.png'; // Added default
    return '/icons/placeholder-suv.png'; // General fallback
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

  const [carPath, setCarPath] = useState([]);
  const [bikePath, setBikePath] = useState([]);
  const [truckPath, setTruckPath] = useState([]);
  const [vanPath, setVanPath] = useState([]); // New state for Vans
  const [busPath, setBusPath] = useState([]); // New state for Buses
  const [otherPath, setOtherPath] = useState([]); // New state for Default/Other
  const [isLoadingPaths, setIsLoadingPaths] = useState(true); 
  const [pathError, setPathError] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let loggedIn = false;
    try {
      loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    } catch (e) { console.error("Could not read sessionStorage:", e); }
    setIsAuthenticated(loggedIn);
    setAuthChecked(true);
    if (!loggedIn) {
      router.replace('/login');
    }
  }, [router]);

  const fetchCompanyMapData = useCallback(async () => {
    setPathError(null);
    try {
      const companyId = "ooo"; 
      const apiRouteUrl = `/api/mapview?company=${encodeURIComponent(companyId)}`;
      const response = await fetch(apiRouteUrl); 
      console.log("[Page.js fetchCompanyMapData] Fetching from Next.js API route:", apiRouteUrl);


      if (!response.ok) {
        let errorBodyText = await response.text();
         console.error(`[Page.js fetchCompanyMapData] API Error ${response.status}: ${errorBodyText.substring(0,500)}`);
        throw new Error(`API Error ${response.status}: ${errorBodyText.substring(0, 200)}`);
      }

      const apiResponseData = await response.json();
      console.log("[Page.js fetchCompanyMapData] API Response:", apiResponseData);

      let vehicleDataArray = [];
      if (apiResponseData && typeof apiResponseData === 'object') {
        if (Array.isArray(apiResponseData)) {
            vehicleDataArray = apiResponseData;
        } else if (apiResponseData.data && Array.isArray(apiResponseData.data)) {
            vehicleDataArray = apiResponseData.data;
        } else if (apiResponseData.vehicles && Array.isArray(apiResponseData.vehicles)) {
            vehicleDataArray = apiResponseData.vehicles;
        } else if ( (typeof apiResponseData.latitude === 'number' || typeof apiResponseData.latitude === 'string') &&
                    (typeof apiResponseData.longitude === 'number' || typeof apiResponseData.longitude === 'string') &&
                     typeof apiResponseData.vehicle_type === 'string') {
            vehicleDataArray = [apiResponseData];
        } else {
            console.warn("[Page.js fetchCompanyMapData] Unexpected API response structure:", apiResponseData);
            vehicleDataArray = [];
        }
      } else {
        console.warn("[Page.js fetchCompanyMapData] API response is not a valid object or array:", apiResponseData);
        setPathError("Unexpected API response format from /mapview.");
        setAllVehicleDetails([]);
        setCarPath([]); setBikePath([]); setTruckPath([]); setVanPath([]); setBusPath([]); setOtherPath([]);
        return;
      }
      
      setAllVehicleDetails(vehicleDataArray);

      const newCarVehicles = [];
      const newBikeVehicles = [];
      const newTruckVehicles = [];
      const newVanVehicles = [];
      const newBusVehicles = [];
      const newOtherVehicles = [];

      if (vehicleDataArray.length > 0) {
        vehicleDataArray.forEach((vehicle, index) => {
          if (!vehicle || typeof vehicle !== 'object') {
            console.warn(`[Page.js] Skipping invalid vehicle item at index ${index}:`, vehicle);
            return;
          }

          const vehicleId = vehicle.imeino || vehicle.vehicle_no || vehicle.id || `vehicle-${Date.now()}-${index}`;
          const vehicleWithId = { ...vehicle, id: vehicleId };

          if ((typeof vehicle.latitude === 'number' || typeof vehicle.latitude === 'string') &&
              (typeof vehicle.longitude === 'number' || typeof vehicle.longitude === 'string') &&
               typeof vehicle.vehicle_type === 'string') {

            const lat = parseFloat(String(vehicle.latitude));
            const lng = parseFloat(String(vehicle.longitude));
            const typeFromVehicle = vehicle.vehicle_type.toLowerCase();

            if (!isNaN(lat) && !isNaN(lng)) {
              if (typeFromVehicle.includes('car') || typeFromVehicle.includes('suv') || typeFromVehicle.includes('muv')) {
                newCarVehicles.push(vehicleWithId);
              } else if (typeFromVehicle.includes('bike') || typeFromVehicle.includes('motorcycle')) {
                newBikeVehicles.push(vehicleWithId);
              } else if (typeFromVehicle.includes('truck')) {
                newTruckVehicles.push(vehicleWithId);
              } else if (typeFromVehicle.includes('van') || typeFromVehicle.includes('tempo') || typeFromVehicle.includes('campervan')) {
                newVanVehicles.push(vehicleWithId);
              } else if (typeFromVehicle.includes('bus')) {
                newBusVehicles.push(vehicleWithId);
              } else if (typeFromVehicle.includes('default')) {
                newOtherVehicles.push(vehicleWithId); // 'Default' goes to 'Other'
                 console.log(`[Page.js] Vehicle ID ${vehicleId} categorized as 'Other' due to type: '${vehicle.vehicle_type}'`);
              }
               else {
                console.warn(`[Page.js] Unhandled vehicle_type: '${vehicle.vehicle_type}' for vehicle ID ${vehicleId}. Categorizing as 'Other'.`);
                newOtherVehicles.push(vehicleWithId);
              }
            } else {
              console.warn(`[Page.js] Invalid lat/lng for vehicle ID ${vehicleId}:`, vehicle.latitude, vehicle.longitude);
            }
          } else {
            console.warn(`[Page.js] Skipping vehicle ID ${vehicleId} due to missing lat/lng or vehicle_type:`, JSON.stringify(vehicle).substring(0,200));
          }
        });
      }

      setCarPath(newCarVehicles);
      setBikePath(newBikeVehicles);
      setTruckPath(newTruckVehicles);
      setVanPath(newVanVehicles);
      setBusPath(newBusVehicles);
      setOtherPath(newOtherVehicles);
      setPathError(null);

      console.log(`[Page.js] Processed Vehicles - Cars: ${newCarVehicles.length}, Bikes: ${newBikeVehicles.length}, Trucks: ${newTruckVehicles.length}, Vans: ${newVanVehicles.length}, Buses: ${newBusVehicles.length}, Others: ${newOtherVehicles.length}`);

    } catch (error) {
      console.error('[Page.js fetchCompanyMapData] Error:', error);
      setPathError(`Failed to load data: ${error.message}`);
      setAllVehicleDetails([]);
      setCarPath([]); setBikePath([]); setTruckPath([]); setVanPath([]); setBusPath([]); setOtherPath([]);
    } finally {
      setIsLoadingPaths(false);
    }
  }, []); 

  useEffect(() => {
    let intervalId = null;
    if (authChecked && isAuthenticated) {
      setIsLoadingPaths(true);
      fetchCompanyMapData(); 
      intervalId = setInterval(fetchCompanyMapData, 10000); 
    } else {
      setIsLoadingPaths(false); 
      setAllVehicleDetails([]); 
      setCarPath([]); setBikePath([]); setTruckPath([]); setVanPath([]); setBusPath([]); setOtherPath([]);
      setPathError(null);
    }
    return () => { 
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, authChecked, fetchCompanyMapData]); 

  const handleMapReady = (mapInstance) => { mapRef.current = mapInstance; };
  const handleZoomIn = () => { mapRef.current?.zoomIn(); };
  const handleZoomOut = () => { mapRef.current?.zoomOut(); };
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
    setTimeout(() => mapRef.current?.invalidateSize(), 300);
  };

  const handleSearch = async (term) => {
    if (!term?.trim()) { setSearchError("Please enter a location to search."); return; }
    if (!mapRef.current) { setSearchError("Map is not ready yet."); return; }
    setIsSearching(true);
    setSearchError(null);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Nominatim search failed with status: ${response.status}`);
      const data = await response.json();
      if (data?.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 15);
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
    if (id === 'send') { 
      toggleVehicleDisplay();
    } else if (id === 'measure') { 
      setIsMeasurePopupOpen(true);
    } else if (id === 'infoPanel') { 
      if (allVehicleDetails.length > 0) {
        const rawData = allVehicleDetails[0]; 
        const transformed = transformVehicleDataForInfoPanel(rawData);
        setSelectedVehicleData(transformed);
        setIsInfoPanelVisible(true); 
      } else {
        setSelectedVehicleData(null);
        setIsInfoPanelVisible(false);
        alert("No vehicle data loaded to display details.");
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
  if (!isAuthenticated) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Redirecting to login...</div>;

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} activeItem={activeNavItem} setActiveItem={setActiveNavItem} />
      {!isSidebarOpen && (
        <button className={styles.openSidebarButton} onClick={toggleSidebar} title="Open Sidebar">
          <FaBars size={20}/>
        </button>
      )}
      <Header onSearch={handleSearch} isSearching={isSearching} />

      <div className={styles.contentArea} style={{ marginLeft: isSidebarOpen ? '260px' : '0' }}>
        {searchError && <div className={styles.searchErrorBanner}>{searchError}<button onClick={() => setSearchError(null)}  className={styles.dismissErrorButton}>×</button></div>}
        {isLoadingPaths && <div className={styles.loadingBanner}>Loading vehicle data...</div>}
        {pathError && !isLoadingPaths && <div className={styles.errorBanner}>{pathError}<button onClick={() => {setPathError(null); setIsLoadingPaths(true); fetchCompanyMapData();}} className={styles.dismissErrorButton}>Retry</button></div>}

        <div className={styles.mapContainer}>
          <MapComponentWithNoSSR
            whenReady={handleMapReady}
            showVehiclesLayer={showVehicles}
            vehicleData={{ 
                cars: carPath,
                bikes: bikePath,
                trucks: truckPath,
                vans: vanPath,
                buses: busPath,
                others: otherPath
            }}
            onVehicleClick={(vehicleApiData) => {
                const transformed = transformVehicleDataForInfoPanel(vehicleApiData);
                setSelectedVehicleData(transformed);
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