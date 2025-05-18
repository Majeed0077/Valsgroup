// src/components/MapComponent.js
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet'; // <<<< ENSURE MapContainer IS IMPORTED
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// ... (other parts of the file like imports, icon definitions, getIconForVehicle) ...
//import React, { useEffect, useRef, useState, useCallback } from 'react'; // Added useState and useCallback
// --- AnimatedVehicleLayer Component ---
const AnimatedVehicleLayer = ({ currentVehiclesData, previousVehiclesData, animationDuration, onVehicleClick }) => {
    const map = useMap();
    const markersRef = useRef({});

    useEffect(() => {
        if (!map) { 
            console.warn("[AnimatedVehicleLayer] Map instance not yet available.");
            return;
        }
        // console.log("[AnimatedVehicleLayer] useEffect running. Map available.");

        const allCurrentVehicles = Object.values(currentVehiclesData || {}).flat();
        const allPreviousVehiclesMap = new Map();
        
        if (previousVehiclesData) {
            Object.values(previousVehiclesData).flat().forEach(v => {
                if (v && v.id) {
                    allPreviousVehiclesMap.set(v.id, v);
                }
            });
        }
        
        const currentVehicleIds = new Set();

        allCurrentVehicles.forEach(currentVehicle => {
            // CORRECTED IF CONDITION:
            if (!currentVehicle || 
                !currentVehicle.id || // Check for id
                typeof currentVehicle.latitude !== 'number' || 
                typeof currentVehicle.longitude !== 'number') {
                console.warn('[AnimatedVehicleLayer] Skipping current vehicle due to missing id, latitude, or longitude:', currentVehicle);
                return; // Skip this iteration
            }
            // End of corrected condition

            currentVehicleIds.add(currentVehicle.id); // This line should be AFTER the return check
            const vehicleId = currentVehicle.id;
            const newPosition = L.latLng(currentVehicle.latitude, currentVehicle.longitude);
            
            let icon = getIconForVehicle(currentVehicle);
            if (!icon || typeof icon.createIcon !== 'function') {
                // console.error(`[AnimatedVehicleLayer] Invalid icon for vehicle ${vehicleId} (type: ${currentVehicle.vehicle_type}). Using Leaflet default. Icon object:`, icon);
                icon = iconRegistry.safeDefault || new L.Icon.Default(); 
            }
            
            const previousVehicle = allPreviousVehiclesMap.get(vehicleId);
            
            let startPosition = newPosition; 
            if (previousVehicle && typeof previousVehicle.latitude === 'number' && typeof previousVehicle.longitude === 'number') {
                startPosition = L.latLng(previousVehicle.latitude, previousVehicle.longitude);
            }

            if (markersRef.current[vehicleId]) { 
                const existing = markersRef.current[vehicleId];
                if (existing.animationId) cancelAnimationFrame(existing.animationId); 
                
                if (existing.marker.options.icon !== icon && icon && typeof icon.createIcon === 'function') {
                    try { existing.marker.setIcon(icon); } catch(e) { console.error("Err setIcon existing:", e, vehicleId); }
                }

                existing.previousPosition = existing.marker.getLatLng(); 
                
                if (existing.previousPosition.equals(newPosition) && startPosition.equals(newPosition)) {
                     try {
                        existing.marker.setLatLng(newPosition);
                        existing.marker.setPopupContent(`<b>${currentVehicle.vehicle_no || vehicleId}</b><br>Status: ${currentVehicle.status || 'N/A'}`);
                     } catch(e) { console.error("Err setLatLng existing:", e, vehicleId); }
                } else {
                    animateMarker(existing.marker, existing.previousPosition || startPosition, newPosition, animationDuration, vehicleId);
                }
                
            } else { 
                const safeIcon = (icon && typeof icon.createIcon === 'function') ? icon : (iconRegistry.safeDefault || new L.Icon.Default());
                try {
                    if (map && map.getPanes()) { 
                        const marker = L.marker(startPosition, { icon: safeIcon })
                            .addTo(map)
                            .bindPopup(`<b>${currentVehicle.vehicle_no || vehicleId}</b><br>Status: ${currentVehicle.status || 'N/A'}`);
                        
                        marker.on('click', () => onVehicleClick && onVehicleClick(currentVehicle));
                        
                        markersRef.current[vehicleId] = { marker, animationId: null, previousPosition: startPosition };
                        if (!startPosition.equals(newPosition)) {
                            animateMarker(marker, startPosition, newPosition, animationDuration, vehicleId);
                        } else {
                             marker.setLatLng(newPosition); 
                        }
                    } else {
                        console.warn("[AnimatedVehicleLayer] Map not ready or panes unavailable for adding new marker:", vehicleId);
                    }
                } catch (e) {
                     console.error("Error creating new marker:", e, "Vehicle ID:", vehicleId);
                }
            }
        });

        // Cleanup removed markers
        Object.keys(markersRef.current).forEach(vehicleId => {
            if (!currentVehicleIds.has(vehicleId)) {
                const oldMarkerData = markersRef.current[vehicleId];
                if (oldMarkerData) {
                    if (oldMarkerData.animationId) cancelAnimationFrame(oldMarkerData.animationId);
                    if (map && map.hasLayer && map.hasLayer(oldMarkerData.marker)) { 
                        map.removeLayer(oldMarkerData.marker);
                    }
                }
                delete markersRef.current[vehicleId];
            }
        });

    }, [currentVehiclesData, previousVehiclesData, map, animationDuration, onVehicleClick]);


    const animateMarker = (marker, fromLatLng, toLatLng, duration, vehicleId) => {
        // ... (Your existing animateMarker function)
        const startTime = performance.now();
        
        function animationStep(currentTime) {
            if (!markersRef.current[vehicleId] || markersRef.current[vehicleId].marker !== marker) {
                return;
            }
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            const lat = fromLatLng.lat + (toLatLng.lat - fromLatLng.lat) * progress;
            const lng = fromLatLng.lng + (toLatLng.lng - fromLatLng.lng) * progress;
            
            try {
                marker.setLatLng([lat, lng]);
            } catch (e) {
                console.error("Error in animationStep setLatLng:", e, "Vehicle ID:", vehicleId);
                if (markersRef.current[vehicleId] && markersRef.current[vehicleId].animationId) {
                    cancelAnimationFrame(markersRef.current[vehicleId].animationId);
                    markersRef.current[vehicleId].animationId = null;
                }
                return;
            }

            if (progress < 1) {
                if (markersRef.current[vehicleId]) { 
                   markersRef.current[vehicleId].animationId = requestAnimationFrame(animationStep);
                }
            } else {
                marker.setLatLng(toLatLng); 
                if(markersRef.current[vehicleId]) { 
                    markersRef.current[vehicleId].previousPosition = toLatLng; 
                    markersRef.current[vehicleId].animationId = null; 
                }
            }
        }
        if (markersRef.current[vehicleId] && markersRef.current[vehicleId].animationId) {
            cancelAnimationFrame(markersRef.current[vehicleId].animationId);
        }
        if (markersRef.current[vehicleId]) { 
            markersRef.current[vehicleId].animationId = requestAnimationFrame(animationStep);
        }
    };

    return null; 
};

// ... (rest of MapComponent.js: Main MapComponent definition, imports, etc.)
// Ensure createVehicleIcon, iconRegistry, getIconForVehicle are defined above AnimatedVehicleLayer
// Main MapComponent definition:
const MapComponent = ({ whenReady, showVehiclesLayer, currentVehicles, previousVehicles, animationDuration, onVehicleClick }) => {
    const defaultPosition = [24.8607, 67.0011];
    const [map, setMap] = useState(null);
    const [mapContainerKey, setMapContainerKey] = useState(Date.now()); 

    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        // Less aggressive HMR key change, only if needed.
        // Consider removing if not actively solving "container already used"
        // const onHotModuleReload = () => setMapContainerKey(Date.now());
        // if (module.hot) { module.hot.addStatusHandler(status => { if (status === 'idle') { /* onHotModuleReload(); */ } }); }
      }
    }, []);

    const MapEvents = () => {
        const mapInstance = useMap();
        useEffect(() => {
            if (mapInstance) {
                setMap(mapInstance); 
                if (whenReady) {
                    whenReady(mapInstance);
                }
            }
        }, [mapInstance]);
        return null;
    };
    
    const hasCurrentVehicles = currentVehicles && Object.values(currentVehicles).some(arr => arr && arr.length > 0);
    const mapPlaceholder = <div style={{height: "100%", width: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee'}}>Loading Map...</div>;

    return (
        <MapContainer
            key={mapContainerKey} 
            center={defaultPosition}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            placeholder={mapPlaceholder}
        >
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents /> 
            
            {showVehiclesLayer && hasCurrentVehicles && map && ( 
                <AnimatedVehicleLayer 
                    currentVehiclesData={currentVehicles}
                    previousVehiclesData={previousVehicles}
                    animationDuration={animationDuration}
                    onVehicleClick={onVehicleClick}
                />
            )}
        </MapContainer>
    );
};

export default MapComponent;