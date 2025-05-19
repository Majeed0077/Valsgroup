// src/components/MapComponent.js
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Leaflet Default Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
// --- End Icon Fix ---

// --- Define Custom Icons ---
// (Ensure these paths are correct and images exist in /public/icons/)
const createVehicleIcon = (iconUrl, size = [38, 38]) => {
    return L.icon({
        iconUrl: iconUrl,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]], // Bottom center
        popupAnchor: [0, -size[1]]    // Above the icon anchor
    });
};

const iconRegistry = {
    car: createVehicleIcon('/icons/car.png', [38, 38]),
    bike: createVehicleIcon('/icons/bike.png', [30, 30]),
    truck: createVehicleIcon('/icons/truck.png', [45, 45]),
    van: createVehicleIcon('/icons/van.png', [40, 40]),
    bus: createVehicleIcon('/icons/bus.png', [42, 42]),
    ambulance: createVehicleIcon('/icons/ambulance.png', [40, 40]),
    rickshaw: createVehicleIcon('/icons/rickshaw.png', [35, 35]),
    hotairballoon: createVehicleIcon('/icons/hotairballoon.png', [50, 50]),
    default: createVehicleIcon('/icons/default-vehicle.png', [35, 35]), // For 'other' category or unmapped
};

const getIconForVehicle = (vehicle) => {
    if (!vehicle || !vehicle.vehicle_type) return iconRegistry.default;
    const type = vehicle.vehicle_type.toLowerCase();

    if (type.includes('ambulance')) return iconRegistry.ambulance;
    if (type.includes('hot air ballon') || type.includes('hotairballon')) return iconRegistry.hotairballoon;
    if (type.includes('rickshaw')) return iconRegistry.rickshaw;
    if (type.includes('truck') || type.includes('mixer') || type.includes('handler') || type.includes('dumper') || type.includes('trailer') || type.includes('ecomet')) return iconRegistry.truck;
    if (type.includes('bus')) return iconRegistry.bus;
    if (type.includes('van') || type.includes('tempo') || type.includes('campervan')) return iconRegistry.van;
    if (type.includes('bike') || type.includes('motorcycle')) return iconRegistry.bike;
    if (type.includes('car') || type.includes('suv') || type.includes('muv') || type.includes('hatchback') || type === 'mercedes') return iconRegistry.car;
    if (type.includes('default')) return iconRegistry.default;
    
    console.warn(`[MapComponent] No specific icon for vehicle_type: "${vehicle.vehicle_type}". Using default.`);
    return iconRegistry.default;
};


// --- Vehicle Markers Layer Component ---
const VehicleMarkersLayer = ({ vehiclesToShow, onVehicleClick }) => {
    const map = useMap(); // Get map instance
    const markersRef = useRef({}); // To store references to Leaflet markers { vehicleId: markerInstance }

    useEffect(() => {
        const currentMarkerIds = Object.keys(markersRef.current);
        const incomingVehicleIds = vehiclesToShow.map(v => v.id);

        // Remove markers for vehicles that are no longer present
        currentMarkerIds.forEach(id => {
            if (!incomingVehicleIds.includes(id) && markersRef.current[id]) {
                map.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
                console.log(`[MapComponent] Removed marker for vehicle ID: ${id}`);
            }
        });

        // Add/Update markers for incoming vehicles
        vehiclesToShow.forEach(vehicle => {
            if (vehicle && typeof vehicle.latitude === 'number' && typeof vehicle.longitude === 'number' && vehicle.id) {
                const position = [vehicle.latitude, vehicle.longitude];
                const icon = getIconForVehicle(vehicle);

                if (markersRef.current[vehicle.id]) {
                    // Marker exists, update its position and potentially icon
                    const marker = markersRef.current[vehicle.id];
                    if (marker.getLatLng().lat !== position[0] || marker.getLatLng().lng !== position[1]) {
                        // For smooth movement, you might use a plugin like react-leaflet-moving-marker
                        // or implement L.Marker.prototype.slideTo if not using a plugin.
                        // For simplicity here, just setting LatLng directly.
                        marker.setLatLng(position);
                        // console.log(`[MapComponent] Updated position for vehicle ID: ${vehicle.id}`);
                    }
                    if (marker.options.icon !== icon) { // Update icon if it changed (e.g. type changed)
                        marker.setIcon(icon);
                    }
                    // Update Popup content if needed (more complex, might need to re-bind)
                     marker.setPopupContent(`<b>${vehicle.vehicle_no || vehicle.id}</b><br>Status: ${vehicle.status || 'N/A'}<br>Speed: ${vehicle.speed !== undefined ? vehicle.speed + ' km/h' : 'N/A'}`);


                } else {
                    // Marker doesn't exist, create and add it
                    const marker = L.marker(position, { icon })
                        .addTo(map)
                        .bindPopup(`<b>${vehicle.vehicle_no || vehicle.id}</b><br>Status: ${vehicle.status || 'N/A'}<br>Speed: ${vehicle.speed !== undefined ? vehicle.speed + ' km/h' : 'N/A'}`);
                    
                    marker.on('click', () => {
                        if (onVehicleClick) {
                            onVehicleClick(vehicle); // Pass the full vehicle object
                        }
                    });
                    markersRef.current[vehicle.id] = marker;
                    console.log(`[MapComponent] Added marker for vehicle ID: ${vehicle.id} at`, position);
                }
            } else {
                console.warn('[MapComponent] Skipping vehicle due to missing id, latitude, or longitude:', vehicle);
            }
        });

        // Cleanup function
        return () => {
            // // Optionally, remove all markers managed by this layer on unmount
            // // This might not be desired if you want markers to persist across layer toggles
            // Object.values(markersRef.current).forEach(marker => {
            //     if (map.hasLayer(marker)) {
            //         map.removeLayer(marker);
            //     }
            // });
            // markersRef.current = {};
        };
    }, [vehiclesToShow, map, onVehicleClick]); // Rerun when vehicles data or map instance changes

    return null; // This component manages Leaflet markers directly
};


// --- Main Map Component Definition ---
const MapComponent = ({ whenReady, showVehiclesLayer, vehicleData, onVehicleClick }) => {
    const defaultPosition = [24.8607, 67.0011]; // Karachi, Pakistan

    // This inner component is used to access the map instance easily
    const MapInstanceAccess = () => {
        const map = useMap();
        useEffect(() => {
            if (map && whenReady) {
                console.log("VehicleLayer: Map instance available, calling whenReady.");
                whenReady(map);
            }
        }, [map, whenReady]);
        return null;
    };

    // Flatten all vehicle data into a single array if showVehiclesLayer is true
    const allVehiclesList = showVehiclesLayer && vehicleData
        ? Object.values(vehicleData).flat().filter(v => v && v.id && typeof v.latitude === 'number' && typeof v.longitude === 'number')
        : [];
    
    // console.log('[MapComponent] Rendering with allVehiclesList count:', allVehiclesList.length);


    return (
        <MapContainer
            center={defaultPosition}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapInstanceAccess />
            
            {showVehiclesLayer && allVehiclesList.length > 0 && (
                <VehicleMarkersLayer vehiclesToShow={allVehiclesList} onVehicleClick={onVehicleClick} />
            )}
        </MapContainer>
    );
};

export default MapComponent;