// src/app/page.js
//
// REMINDER: You need to create an API Route (e.g., src/app/api/maptrack/route.js)
// to proxy requests to the external API. This client-side code will call that API route.
// The Authorization header for the external API should be handled within that API route.
//
'use client';

// --- React and Next.js Imports ---
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For redirection
import dynamic from 'next/dynamic'; // For client-side component loading

// --- Component Imports ---
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MapControls from '@/components/MapControls';
import MeasurePopup from '@/components/MeasurePopup'; // The measurement units popup
import InfoPanel from '@/components/InfoPanel';      // The slide-out info panel

// --- Styles and Icons ---
import styles from './page.module.css';
import { FaBars } from 'react-icons/fa'; // Icon for opening sidebar

// --- Dynamically Import Map Component ---
const MapComponentWithNoSSR = dynamic(
  () => import('@/components/MapComponent'),
  { ssr: false }
);

// --- Main Page Component Definition ---
export default function Home() {
  // --- State Variables ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const mapRef = useRef(null);
  const [showVehicles, setShowVehicles] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isMeasurePopupOpen, setIsMeasurePopupOpen] = useState(false);
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(false);
  
  const [selectedVehicleData, setSelectedVehicleData] = useState(null); 
  const [allVehicleDetails, setAllVehicleDetails] = useState([]); 

  const [carPath, setCarPath] = useState([]);
  const [bikePath, setBikePath] = useState([]);
  const [truckPath, setTruckPath] = useState([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true); // Start true for initial load
  const [pathError, setPathError] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Hooks ---
  const router = useRouter();

  // --- EFFECT FOR AUTH CHECK & REDIRECTION ---
  useEffect(() => {
    let loggedIn = false;
    try {
      loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    } catch (e) {
      console.error("Could not read sessionStorage:", e);
      // loggedIn remains false
    }
    setIsAuthenticated(loggedIn);
    setAuthChecked(true); // Auth check is complete
    if (!loggedIn) {
      console.log("Auth check: User not authenticated, redirecting to login.");
      router.replace('/login');
    } else {
      console.log("Auth check: User authenticated.");
    }
  }, [router]); // Only re-run if router instance changes

  // --- EFFECT FOR FETCHING VEHICLE DATA PERIODICALLY ---
  useEffect(() => {
      let intervalId = null;

      // const fetchVehicleData = async () => {
      //     setPathError(null); 
      //     // setIsLoadingPaths(true); // Set true at the beginning of fetch if not already loading

      //     try {
      //       const imeino = "866968033179947";
      //       const fdate = "14-MAY-2025 00:00:00";
      //       const tdate = "14-MAY-2025 23:59:59";
            
      //       // Calls your Next.js API route which will proxy to the external API
      //       const apiUrl = `/api/maptrack?imeino=${encodeURIComponent(imeino)}&fdate=${encodeURIComponent(fdate)}&tdate=${encodeURIComponent(tdate)}`;
      //       console.log("Fetching from Next.js API route:", apiUrl);

      //       const response = await fetch(apiUrl); // No Authorization header here; API route handles it for external call

      //       if (!response.ok) {
      //           if (response.status === 401) { // Assuming your proxy might also return 401 if external API does
      //                console.error("Authentication failed (possibly via proxy), redirecting to login.");
      //                setIsAuthenticated(false); 
      //                try { sessionStorage.removeItem('isLoggedIn'); } catch(e) { console.error("Failed to clear sessionStorage", e); }
      //                // No need to call router.replace here if the auth check effect handles it
      //                return; 
      //           }
      //           const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      //           throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      //       }

      //       const apiResponseData = await response.json();
      //       console.log("API Response Data (from /api/maptrack):", apiResponseData);

      //       let vehicleDataArray = [];
      //       if (apiResponseData && typeof apiResponseData === 'object') {
      //           if (Array.isArray(apiResponseData)) {
      //               vehicleDataArray = apiResponseData;
      //           } else {
      //               vehicleDataArray = [apiResponseData];
      //           }
      //       } else {
      //           console.warn("API response is not a valid object or array:", apiResponseData);
      //           setPathError("Unexpected API response format.");
      //           setAllVehicleDetails([]);
      //           setCarPath([]); setBikePath([]); setTruckPath([]);
      //           setIsLoadingPaths(false);
      //           return; 
      //       }
            
      //       setAllVehicleDetails(vehicleDataArray);

      //       const newCarPath = [];
      //       const newBikePath = [];
      //       const newTruckPath = [];

      //       if (vehicleDataArray.length > 0) {
      //           vehicleDataArray.forEach(vehicle => {
      //               if (vehicle && typeof vehicle === 'object' && Array.isArray(vehicle.path) && typeof vehicle.type === 'string') {
      //                   if (vehicle.type.toLowerCase() === 'car') {
      //                       newCarPath.push(...vehicle.path);
      //                   } else if (vehicle.type.toLowerCase() === 'bike') {
      //                       newBikePath.push(...vehicle.path);
      //                   } else if (vehicle.type.toLowerCase() === 'truck') {
      //                       newTruckPath.push(...vehicle.path);
      //                   }
      //               } else {
      //                    console.warn("Skipping vehicle for path extraction due to missing 'path' array or 'type' string:", vehicle);
      //               }
      //           });
      //       } else {
      //           console.log("No vehicle data received from API to process paths.");
      //       }

      //       setCarPath(newCarPath);
      //       setBikePath(newBikePath);
      //       setTruckPath(newTruckPath);

      //       console.log("Fetched Car Path (state updated):", newCarPath.length ? `${newCarPath.length} points` : 'No points');
      //       console.log("Fetched Bike Path (state updated):", newBikePath.length ? `${newBikePath.length} points` : 'No points');
      //       console.log("Fetched Truck Path (state updated):", newTruckPath.length ? `${newTruckPath.length} points` : 'No points');

      //     } catch (error) {
      //         console.error('Error fetching or processing vehicle data:', error);
      //         setPathError(`Failed to load vehicle data: ${error.message}`);
      //         setAllVehicleDetails([]);
      //         setCarPath([]);
      //         setBikePath([]);
      //         setTruckPath([]);
      //     } finally {
      //         setIsLoadingPaths(false); // Set to false after fetch completes or errors
      //     }
      // };
const fetchVehicleData = async () => {
          setPathError(null);
          // setIsLoadingPaths(true); // Already handled by the effect's isAuthenticated check

          try {
            const imeino = "866968033179947";
            const fdate = "14-MAY-2025 00:00:00";
            const tdate = "14-MAY-2025 23:59:59";
            
            // Calls your Next.js API route
            const apiUrl = `/api/maptrack?imeino=${encodeURIComponent(imeino)}&fdate=${encodeURIComponent(fdate)}&tdate=${encodeURIComponent(tdate)}`;
            console.log("[Page.js] Fetching from Next.js API route:", apiUrl);

            // CORRECT: No Authorization header here. It's handled by /api/maptrack/route.js
            const response = await fetch(apiUrl); 

            if (!response.ok) {
                // This part will now handle errors from your /api/maptrack route
                let errorData = { message: `Error from API: ${response.status} ${response.statusText}` };
                try {
                    // Try to parse the JSON error response from your API route
                    const parsedError = await response.json();
                    errorData.message = parsedError.error || parsedError.message || errorData.message;
                    if(parsedError.details) errorData.details = parsedError.details;
                } catch (e) {
                    // If parsing fails, use the status text
                    console.warn("[Page.js] Could not parse error response as JSON from /api/maptrack");
                }

                if (response.status === 401) {
                     console.error("[Page.js] Authentication failed (possibly via proxy), redirecting to login.", errorData);
                     setIsAuthenticated(false); 
                     try { sessionStorage.removeItem('isLoggedIn'); } catch(e) { console.error("Failed to clear sessionStorage", e); }
                     // The auth effect will handle router.replace
                     throw new Error(errorData.message || "Authentication Failed"); // Throw to stop further processing
                }
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const apiResponseData = await response.json();
            console.log("[Page.js] API Response Data (from /api/maptrack):", apiResponseData);

            // ... rest of your data processing logic ...
            // (This part seemed fine in your previous file)

          } catch (error) {
              console.error('[Page.js] Error fetching or processing vehicle data:', error.message, error.details || '');
              setPathError(`Failed to load vehicle data: ${error.message}`);
              setAllVehicleDetails([]);
              setCarPath([]);
              setBikePath([]);
              setTruckPath([]);
          } finally {
              setIsLoadingPaths(false);
          }
      };
      if (isAuthenticated) { // Only fetch if authenticated
          setIsLoadingPaths(true); // Set loading true before initial fetch
          fetchVehicleData(); // Initial fetch
          intervalId = setInterval(fetchVehicleData, 10000); // Subsequent fetches
          console.log("Vehicle data fetching interval started (every 10s).");
      } else {
          // If not authenticated, ensure loading is false and paths are clear
          setIsLoadingPaths(false);
          setAllVehicleDetails([]);
          setCarPath([]);
          setBikePath([]);
          setTruckPath([]);
          console.log("User not authenticated, data fetching not started.");
      }

      return () => { // Cleanup function
          if (intervalId !== null) {
              clearInterval(intervalId);
              console.log("Vehicle data fetching interval cleared.");
          }
          // Don't set isLoadingPaths to false here on unmount,
          // as it might hide a loading state if component unmounts/remounts quickly.
          // It's better handled in the fetch logic itself.
      };
  }, [isAuthenticated]); // Re-run effect if isAuthenticated changes

  // --- Component Handlers ---
  const handleMapReady = (mapInstance) => {
    console.log('Map ready.');
    mapRef.current = mapInstance;
  };
  const handleZoomIn = () => { mapRef.current?.zoomIn(); };
  const handleZoomOut = () => { mapRef.current?.zoomOut(); };
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
    setTimeout(() => {
        mapRef.current?.invalidateSize();
    }, 300); 
  };
  const handleSearch = async (term) => {
    if (!term?.trim()) { setSearchError("Please enter a location..."); return; }
    if (!mapRef.current) { setSearchError("Map not ready..."); return; }
    setIsSearching(true);
    setSearchError(null);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Search failed (${response.status})`);
      const data = await response.json();
      if (data?.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 15);
      } else {
        setSearchError(`Could not find: "${term}"`);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(`Search error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleVehicleDisplay = () => {
     setShowVehicles(prev => !prev);
     console.log(`Toggling vehicle display: ${!showVehicles}`);
  };

  const handleMapControlClick = (id) => {
    console.log('Map control clicked:', id);
    if (id === 'send') { 
      toggleVehicleDisplay();
    } else if (id === 'measure') { 
      setIsMeasurePopupOpen(true);
    } else if (id === 'infoPanel') { 
      if (allVehicleDetails.length > 0) {
        setSelectedVehicleData(allVehicleDetails[0]); 
      } else {
        setSelectedVehicleData(null);
        console.warn("No detailed vehicle data available from API for InfoPanel.");
      }
      setIsInfoPanelVisible((prev) => !prev);
    }
  };

  const closeMeasurePopup = () => { setIsMeasurePopupOpen(false); };
  const handleApplyMeasureSettings = (settings) => { console.log("Applying measure settings:", settings); closeMeasurePopup(); };

  const closeInfoPanel = () => {
      setIsInfoPanelVisible(false);
  }

  // --- Conditional Rendering for Authentication ---
  if (!authChecked) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2em' }}>Checking authentication...</div>;
  }
  // If authChecked is true, but user is not authenticated, the redirection to /login
  // should be handled by the useEffect. You might still want a fallback UI here
  // or rely purely on the redirection.
  if (!isAuthenticated && authChecked) { 
      // This UI will be briefly shown while router.replace('/login') is in progress
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2em' }}>Redirecting to login...</div>;
  }
  // Only render main UI if authenticated
  if (!isAuthenticated) {
      return null; // Or a more explicit "Not Authenticated" message if redirection fails
  }


  // --- Render Main UI ---
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
        {searchError && (
          <div className={styles.searchErrorBanner}>
            {searchError}
            <button onClick={() => setSearchError(null)} title="Dismiss error" className={styles.dismissErrorButton}>×</button>
          </div>
        )}
        {isLoadingPaths && ( // Show loading banner when isLoadingPaths is true
            <div className={styles.loadingBanner}>Loading vehicle data...</div>
        )}
        {pathError && !isLoadingPaths && ( // Show error only if not loading (to avoid showing both)
             <div className={styles.errorBanner}>
                {pathError}
             </div>
        )}

        <div className={styles.mapContainer}>
          <MapComponentWithNoSSR
            whenReady={handleMapReady}
            showVehicles={showVehicles}
            vehiclePaths={{ car: carPath, bike: bikePath, truck: truckPath }}
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