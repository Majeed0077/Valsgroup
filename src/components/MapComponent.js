// src/components/MapComponent.js
'use client';

import React, { useEffect, useRef, useState } from 'react'; // Removed useCallback
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Leaflet Default Icon Path ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Icon Definitions ---
// ENSURE THESE PATHS ARE CORRECT (relative to your `public` folder)
// e.g., /icons/car.png means your file is at public/icons/car.png
const iconRegistry = {
    car: createVehicleIcon('/icons/car.png'),
    truck: createVehicleIcon('/icons/truck.png'),
    bike: createVehicleIcon('/icons/bike.png'),
    van: createVehicleIcon('/icons/van.png'),
    bus: createVehicleIcon('/icons/bus.png'),
    ambulance: createVehicleIcon('/icons/ambulance.png'),
    rickshaw: createVehicleIcon('/icons/rickshaw.png'), // path corrected from your page.js
    hotairballoon: createVehicleIcon('/icons/hotairballoon.png'),
    default: createVehicleIcon('/icons/default-vehicle.png'),
    placeholder: createVehicleIcon('/icons/placeholder-suv.png'), // Fallback
    safeDefault: L.icon({ // Absolute Leaflet fallback
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', shadowSize: [41, 41]
    })
};

function createVehicleIcon(iconUrl, size = [32, 32], anchor = [16, 16]) {
    if (!iconUrl) {
        // console.warn("[createVehicleIcon] iconUrl missing. Using safe default.");
        return iconRegistry.safeDefault; // Return a valid Leaflet icon
    }
    try {
        return L.icon({
            iconUrl: iconUrl,
            iconSize: size,
            iconAnchor: anchor,
            popupAnchor: [0, -Math.round(size[1] / 2)], // Adjusted popup anchor
        });
    } catch (e) {
        console.error("[createVehicleIcon] Error for iconUrl:", iconUrl, e);
        return iconRegistry.safeDefault; // Return a valid Leaflet icon on error
    }
}

const getIconForVehicle = (vehicle) => {
    if (!vehicle || !vehicle.vehicle_type) {
        // console.warn("[getIconForVehicle] No vehicle or vehicle_type. Using default icon.");
        return iconRegistry.default || iconRegistry.safeDefault;
    }
    const type = String(vehicle.vehicle_type).toLowerCase();

    if (type.includes('truck') || type.includes('mixer') || type.includes('handler') || type.includes('dumper') || type.includes('trailer') || type.includes('ecomet')) return iconRegistry.truck || iconRegistry.default;
    if (type.includes('car') || type.includes('suv') || type.includes('muv') || type.includes('hatchback') || type.includes('mercedes')) return iconRegistry.car || iconRegistry.default;
    if (type.includes('bike') || type.includes('motorcycle')) return iconRegistry.bike || iconRegistry.default;
    if (type.includes('ambulance')) return iconRegistry.ambulance || iconRegistry.van || iconRegistry.default;
    if (type.includes('van') || type.includes('tempo') || type.includes('campervan')) return iconRegistry.van || iconRegistry.default;
    if (type.includes('bus')) return iconRegistry.bus || iconRegistry.default;
    if (type.includes('rickshaw')) return iconRegistry.rickshaw || iconRegistry.default;
    if (type.includes('hot air ballon') || type.includes('hotairballon')) return iconRegistry.hotairballoon || iconRegistry.default;
    if (type.includes('default')) return iconRegistry.default;
    
    // console.warn(`[getIconForVehicle] Unhandled type: '${type}'. Using placeholder.`);
    return iconRegistry.placeholder || iconRegistry.safeDefault;
};

// --- StaticVehicleLayer Component (Simplified - NO ANIMATION) ---
const StaticVehicleLayer = ({ currentVehiclesData, onVehicleClick }) => {
    const map = useMap();
    const markersRef = useRef({}); // Stores { [vehicleId]: markerInstance }

    useEffect(() => {
        if (!map) {
            // console.warn("[StaticVehicleLayer] Map instance not available.");
            return;
        }
        // console.log("[StaticVehicleLayer] EFFECT - CurrentVehiclesData:", JSON.stringify(currentVehiclesData, null, 2));

        const allCurrentVehicles = Object.values(currentVehiclesData || {}).flat().filter(Boolean);
        const currentVehicleIdsOnMap = new Set();

        // console.log("[StaticVehicleLayer] Vehicles to process:", allCurrentVehicles.length);

        allCurrentVehicles.forEach(currentVehicle => {
            if (!currentVehicle || !currentVehicle.id || typeof currentVehicle.latitude !== 'number' || typeof currentVehicle.longitude !== 'number') {
                // console.warn('[StaticVehicleLayer] Skipping vehicle due to invalid data (missing id, lat, or lng):', currentVehicle);
                return;
            }
            currentVehicleIdsOnMap.add(currentVehicle.id);

            const vehicleId = currentVehicle.id;
            const newPosition = L.latLng(currentVehicle.latitude, currentVehicle.longitude);
            let icon = getIconForVehicle(currentVehicle);

            if (!icon || typeof icon.createIcon !== 'function') { // Check if icon is a valid Leaflet icon object
                // console.error(`[StaticVehicleLayer] Invalid icon resolved for vehicle ${vehicleId} (type: ${currentVehicle.vehicle_type}). Using safe default.`);
                icon = iconRegistry.safeDefault;
            }

            if (markersRef.current[vehicleId]) { // Marker exists, update it
                const existingMarker = markersRef.current[vehicleId];
                try {
                    if (!existingMarker.getLatLng().equals(newPosition)) {
                        existingMarker.setLatLng(newPosition);
                    }
                    if (existingMarker.options.icon !== icon) { // Check if icon instance itself has changed
                         existingMarker.setIcon(icon);
                    }
                    // Always update popup content in case status or other details changed
                    existingMarker.setPopupContent(`<b>${currentVehicle.vehicle_no || vehicleId}</b><br>Status: ${currentVehicle.status || 'N/A'}`);
                } catch (e) {
                    console.error(`[StaticVehicleLayer] Error updating marker ${vehicleId}:`, e);
                }
            } else { // New marker, create and add it
                if (map.getPanes()) { // Ensure map is ready for adding layers
                    try {
                        // console.log(`[StaticVehicleLayer] Creating new marker for ${vehicleId} at`, newPosition, "with icon:", icon.options.iconUrl);
                        const marker = L.marker(newPosition, { icon: icon })
                            .addTo(map)
                            .bindPopup(`<b>${currentVehicle.vehicle_no || vehicleId}</b><br>Status: ${currentVehicle.status || 'N/A'}`);
                        
                        marker.on('click', () => onVehicleClick && onVehicleClick(currentVehicle));
                        markersRef.current[vehicleId] = marker;
                    } catch (e) {
                        console.error(`[StaticVehicleLayer] Error CREATING new marker for ${vehicleId}:`, e, "Icon was:", icon);
                    }
                } else {
                    // console.warn(`[StaticVehicleLayer] Map panes not ready for adding marker ${vehicleId}`);
                }
            }
        });

        // Cleanup: Remove markers for vehicles no longer in currentVehiclesData
        Object.keys(markersRef.current).forEach(existingVehicleId => {
            if (!currentVehicleIdsOnMap.has(existingVehicleId)) {
                const markerToRemove = markersRef.current[existingVehicleId];
                if (map.hasLayer(markerToRemove)) {
                    try {
                        map.removeLayer(markerToRemove);
                    } catch (e) {
                         console.error(`[StaticVehicleLayer] Error removing marker ${existingVehicleId}:`, e);
                    }
                }
                delete markersRef.current[existingVehicleId];
                // console.log(`[StaticVehicleLayer] Removed marker for ${existingVehicleId}`);
            }
        });

    }, [currentVehiclesData, map, onVehicleClick]); // Dependencies for static layer

    return null;
};

// --- Main MapComponent ---
const MapComponent = ({ whenReady, showVehiclesLayer, currentVehicles, onVehicleClick }) => {
    // Removed previousVehicles, animationDuration as they are not used in static version
    const defaultPosition = [24.8607, 67.0011]; // Karachi
    const [mapInstance, setMapInstance] = useState(null);
    // mapContainerKey can be removed if HMR issues are not present or handled differently
    // const [mapContainerKey, setMapContainerKey] = useState(Date.now());

    const hasCurrentVehicles = currentVehicles &&
        Object.values(currentVehicles).some(arr => Array.isArray(arr) && arr.length > 0);
    
    // console.log("[MapComponent] Rendering. Has current vehicles:", hasCurrentVehicles, "CurrentVehicles data:", JSON.stringify(currentVehicles));


    const mapPlaceholder = (
        <div style={{ height: "100%", width: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee', color: '#333' }}>
            Loading Map...
        </div>
    );

    return (
        <MapContainer
            // key={mapContainerKey}
            center={defaultPosition}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => { // Standard way to get map instance
                setMapInstance(map);
                if (whenReady) {
                    whenReady(map);
                }
            }}
            placeholder={mapPlaceholder}
        >
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {showVehiclesLayer && hasCurrentVehicles && mapInstance && (
                <StaticVehicleLayer
                    currentVehiclesData={currentVehicles}
                    onVehicleClick={onVehicleClick}
                />
            )}
        </MapContainer>
    );
};

export default MapComponent;