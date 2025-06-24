"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { FaBars } from "react-icons/fa";
import styles from "@/components/Dashboard.module.css"; // Ensure path is correct
import Sidebar from "@/components/Sidebar";             // Ensure path is correct
import Header from "@/components/Header";               // Ensure path is correct
import MapControls from "@/components/MapControls";         // Ensure path is correct
import MeasurePopup from "@/components/MeasurePopup";       // Ensure path is correct
import InfoPanel from "@/components/InfoPanel";           // Ensure path is correct
import { useAuth } from "@/app/fleet-dashboard/useAuth";    // Ensure path is correct
import { useMapData } from "@/app/fleet-dashboard/useMapData";  // Ensure path is correct

// Dynamically import the MapComponent to avoid SSR issues with Leaflet
const MapComponentWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading Map...</div>, // A placeholder while the map loads
});

export default function DashboardPage() {
  const mapRef = useRef(null);

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isMeasurePopupOpen, setIsMeasurePopupOpen] = useState(false);
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(false);
  const [selectedVehicleData, setSelectedVehicleData] = useState(null);
  const [showVehicles, setShowVehicles] = useState(true);
  
  // --- Data & Filtering State ---
  const { authChecked, isAuthenticated } = useAuth();
  const {
    groupedVehicles, // Use the corrected state name from the hook
    isLoading,
    error,
    fetchCompanyMapData,
  } = useMapData();
  const [activeGroups, setActiveGroups] = useState([]); // State to manage which groups are visible on the map

  // --- Data Fetching and Syncing Effects ---
  useEffect(() => {
    // This effect runs once to set up intervals for data syncing and fetching.
    
    // Function to run the background data sync from the external source
    const triggerBackgroundSync = async () => {
      try {
        await fetch('/api/sync-vehicles'); // This just triggers the sync; we don't need the response here.
      } catch (err) {
        console.error("Error triggering background sync:", err);
      }
    };
    
    // Function to fetch the latest data for displaying on the UI
    const refreshUIData = () => {
      if (authChecked && isAuthenticated) {
        fetchCompanyMapData();
      }
    };

    // Run both immediately on component mount
    triggerBackgroundSync();
    refreshUIData();
    
    // Set up intervals
    const syncInterval = setInterval(triggerBackgroundSync, 60000); // Sync every 60 seconds
    const fetchInterval = setInterval(refreshUIData, 15000); // Refresh UI data every 15 seconds

    // Cleanup function to clear intervals when the component unmounts
    return () => {
      clearInterval(syncInterval);
      clearInterval(fetchInterval);
    };
  }, [authChecked, isAuthenticated, fetchCompanyMapData]);

  // Effect to set the default active groups once data is loaded
  useEffect(() => {
    if (Object.keys(groupedVehicles).length > 0 && activeGroups.length === 0) {
      // Activate all groups by default the first time data loads
      setActiveGroups(Object.keys(groupedVehicles)); 
    }
  }, [groupedVehicles, activeGroups]);

  // --- UI Event Handlers ---
  const handleMapReady = (mapInstance) => (mapRef.current = mapInstance);
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeInfoPanel = () => setIsInfoPanelVisible(false);

  const handleVehicleClick = (vehicle) => {
    // The InfoPanel now handles the raw API data directly.
    setSelectedVehicleData(vehicle);
    setIsInfoPanelVisible(true);
  };
  
  const handleVehicleSelectFromSidebar = (vehicle) => {
    handleVehicleClick(vehicle);
    // Fly the map to the selected vehicle's location
    if (mapRef.current) {
      mapRef.current.flyTo([vehicle.latitude, vehicle.longitude], 16);
    }
  };

  const handleSearch = async (term) => {
    // Search logic remains the same
    if (!term?.trim()) return setSearchError("Please enter a location.");
    if (!mapRef.current) return setSearchError("Map not ready.");
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1`);
      const data = await res.json();
      if (data?.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 15);
      } else {
        setSearchError(`Location "${term}" not found.`);
      }
    } catch (err) {
      setSearchError(`Search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapControlClick = (id) => {
    if (id === "send") setShowVehicles((prev) => !prev);
    else if (id === "measure") setIsMeasurePopupOpen(true);
  };

  // --- Render Logic ---
  if (!authChecked) return <div className={styles.loadingBanner}>Checking authentication...</div>;
  if (!isAuthenticated) return <div className={styles.loadingBanner}>Redirecting to login...</div>;

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeItem={activeNavItem}
        setActiveItem={setActiveNavItem}
        // Pass the correct props to the Sidebar
        vehicleGroups={groupedVehicles}
        activeGroups={activeGroups}
        setActiveGroups={setActiveGroups} 
        onVehicleSelect={handleVehicleSelectFromSidebar}
        isLoading={isLoading}
      />
      {!isSidebarOpen && (
        <button className={styles.openSidebarButton} onClick={toggleSidebar} title="Open Sidebar">
          <FaBars size={20} />
        </button>
      )}
      <Header onSearch={handleSearch} isSearching={isSearching} />
      <div className={styles.contentArea} style={{ marginLeft: isSidebarOpen ? "260px" : "0" }}>
        {searchError && <div className={styles.searchErrorBanner}>{searchError} <button onClick={() => setSearchError(null)} className={styles.dismissErrorButton}>×</button></div>}
        {isLoading && !Object.keys(groupedVehicles).length && <div className={styles.loadingBanner}>Loading vehicle data...</div>}
        {error && <div className={styles.errorBanner}>{error} <button onClick={() => fetchCompanyMapData()} className={styles.dismissErrorButton}>Retry</button></div>}

        <div className={styles.mapContainer}>
          <MapComponentWithNoSSR
            whenReady={handleMapReady}
            showVehiclesLayer={showVehicles}
            // Pass the correct, grouped vehicle data
            vehicleData={groupedVehicles} 
            // Pass the active groups for filtering
            activeGroups={activeGroups} 
            onVehicleClick={handleVehicleClick}
          />
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onControlClick={handleMapControlClick}
          />
        </div>
      </div>
      <MeasurePopup isOpen={isMeasurePopupOpen} onClose={() => setIsMeasurePopupOpen(false)} onApply={() => {}} />
      <InfoPanel
        isVisible={isInfoPanelVisible}
        onClose={closeInfoPanel}
        data={selectedVehicleData}
      />
    </>
  );
}