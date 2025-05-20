'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FaBars } from 'react-icons/fa';
import styles from './page.module.css';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MapControls from '@/components/MapControls';
import MeasurePopup from '@/components/MeasurePopup';
import InfoPanel from '@/components/InfoPanel';

import { useAuth } from '../app/fleet-dashboard/useAuth';
import { useMapData } from '../app/fleet-dashboard//useMapData';
import { transformVehicleDataForInfoPanel } from '../app/fleet-dashboard//transformVehicleData';

const MapComponentWithNoSSR = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function HomePage() {
  const mapRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isMeasurePopupOpen, setIsMeasurePopupOpen] = useState(false);
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(false);
  const [selectedVehicleData, setSelectedVehicleData] = useState(null);
  const [showVehicles, setShowVehicles] = useState(true);

  const { authChecked, isAuthenticated } = useAuth();
  const {
    allVehicleDetails,
    categorizedPaths,
    isLoading,
    error,
    fetchCompanyMapData
  } = useMapData();

  useEffect(() => {
    let intervalId;
    if (authChecked && isAuthenticated) {
      fetchCompanyMapData();
      intervalId = setInterval(fetchCompanyMapData, 10000);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [authChecked, isAuthenticated, fetchCompanyMapData]);

  const handleMapReady = (mapInstance) => mapRef.current = mapInstance;
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
    setTimeout(() => mapRef.current?.invalidateSize(), 300);
  };

  const handleSearch = async (term) => {
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
    if (id === 'send') toggleVehicleDisplay();
    else if (id === 'measure') setIsMeasurePopupOpen(true);
    else if (id === 'infoPanel') {
      const rawData = allVehicleDetails[0];
      const transformed = transformVehicleDataForInfoPanel(rawData);
      setSelectedVehicleData(transformed);
      setIsInfoPanelVisible(true);
    }
  };

  const toggleVehicleDisplay = () => setShowVehicles(prev => !prev);
  const closeMeasurePopup = () => setIsMeasurePopupOpen(false);
  const handleApplyMeasureSettings = (settings) => {
    console.log("Measure settings:", settings);
    closeMeasurePopup();
  };
  const closeInfoPanel = () => setIsInfoPanelVisible(false);

  if (!authChecked) return <div className={styles.loading}>Checking authentication...</div>;
  if (!isAuthenticated) return <div className={styles.loading}>Redirecting to login...</div>;

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
        {searchError && <div className={styles.searchErrorBanner}>{searchError} <button onClick={() => setSearchError(null)} className={styles.dismissErrorButton}>×</button></div>}
        {isLoading && <div className={styles.loadingBanner}>Loading vehicle data...</div>}
        {error && !isLoading && <div className={styles.errorBanner}>{error} <button onClick={() => { fetchCompanyMapData(); }} className={styles.dismissErrorButton}>Retry</button></div>}

        <div className={styles.mapContainer}>
          <MapComponentWithNoSSR
            whenReady={handleMapReady}
            showVehiclesLayer={showVehicles}
            vehicleData={categorizedPaths}
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
      <InfoPanel isVisible={isInfoPanelVisible} onClose={closeInfoPanel} data={selectedVehicleData} />
    </>
  );
}
