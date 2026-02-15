'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { FaBars } from 'react-icons/fa';
import styles from '@/app/page.module.css';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MapControls from '@/components/MapControls';
import MeasurePopup from '@/components/MeasurePopup';
import TelemetryPanel from '@/components/TelemetryPanel';

import { useAuth } from './useAuth';
import { useMapData } from './useMapData';

const MapComponentWithNoSSR = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className={styles.mapLoadingOverlay}>Loading Map...</div>
});

export default function HomePage() {
  const mapRef = useRef(null);
  
  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isMeasurePopupOpen, setIsMeasurePopupOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [telemetryVehicle, setTelemetryVehicle] = useState(null);
  const [showVehicles, setShowVehicles] = useState(true);

  // --- Data & Auth Hooks ---
  const { authChecked, isAuthenticated } = useAuth();
  const {
    // --- CORRECTION: Use the correct variable name from the hook ---
    groupedVehicles, 
    isLoading,
    error,
    fetchCompanyMapData
  } = useMapData();

  // --- CORRECTION: Add state to manage active groups ---
  const [activeGroups, setActiveGroups] = useState([]);

  // --- Data Fetching Effect ---
  useEffect(() => {
    let intervalId;
    if (authChecked && isAuthenticated) {
      fetchCompanyMapData(); // Fetch once immediately
      intervalId = setInterval(fetchCompanyMapData, 15000); // Then refresh every 15 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [authChecked, isAuthenticated, fetchCompanyMapData]);

  // --- CORRECTION: Effect to set default active groups when data first arrives ---
  useEffect(() => {
    if (Object.keys(groupedVehicles).length > 0 && activeGroups.length === 0) {
      // By default, activate all groups so vehicles are visible on first load
      setActiveGroups(Object.keys(groupedVehicles));
    }
  }, [groupedVehicles, activeGroups]);


  // --- Event Handlers ---
  const handleMapReady = (mapInstance) => (mapRef.current = mapInstance);
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const handleVehicleClick = (vehicle) => {
    setTelemetryVehicle(vehicle);
    setIsTelemetryOpen(true);
  };
  
  const handleVehicleSelectFromSidebar = (vehicle) => {
    handleVehicleClick(vehicle);
    if (mapRef.current) {
      mapRef.current.flyTo([vehicle.latitude, vehicle.longitude], 16);
    }
  };

  const handleSearch = async (term) => {
    // (Search logic remains the same)
    if (!term?.trim()) return setSearchError("Please enter a location.");
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
    if (id === 'toggleSidebar') setIsTelemetryOpen(prev => !prev);
    if (id === 'send') toggleVehicleDisplay();
    else if (id === 'measure') setIsMeasurePopupOpen(true);
  };

  const toggleVehicleDisplay = () => setShowVehicles(prev => !prev);

  // --- Render Logic ---
  if (!authChecked) return <div className={styles.fullScreenState}>Checking authentication...</div>;
  if (!isAuthenticated) return <div className={styles.fullScreenState}>Redirecting to login...</div>;

  return (
    <>
      {/* --- CORRECTION: Pass correct props to Sidebar --- */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeItem={activeNavItem}
        setActiveItem={setActiveNavItem}
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
      <div className={styles.contentArea} style={{ marginLeft: isSidebarOpen ? '100px' : '0' }}>
        {searchError && <div className={styles.searchErrorBanner}>{searchError} <button onClick={() => setSearchError(null)} className={styles.dismissErrorButton}>&times;</button></div>}
        {isLoading && !Object.keys(groupedVehicles).length && <div className={styles.loadingBanner}>Loading vehicle data...</div>}
        {error && <div className={styles.errorBanner}>{error} <button onClick={fetchCompanyMapData} className={styles.dismissErrorButton}>Retry</button></div>}

        <div className={styles.mapContainer}>
          {/* --- CORRECTION: Pass correct props to MapComponent --- */}
          <MapComponentWithNoSSR
            whenReady={handleMapReady}
            showVehiclesLayer={showVehicles}
            vehicleData={groupedVehicles} // Use the correct data variable
            activeGroups={activeGroups}   // Pass the active groups for filtering
            onVehicleClick={handleVehicleClick}
            showBuiltInControls={false}
          />
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onControlClick={handleMapControlClick}
            isPanelOpen={isTelemetryOpen}
          />
          <TelemetryPanel isOpen={isTelemetryOpen} vehicle={telemetryVehicle} />
        </div>
      </div>

      <MeasurePopup isOpen={isMeasurePopupOpen} onClose={() => setIsMeasurePopupOpen(false)} onApply={() => {}} />
    </>
  );
}
