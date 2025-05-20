// src/components/MapComponent.js
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import MarkerCluster CSS & JS
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'; // Default styling for clusters
import 'leaflet.markercluster'; // This line imports the JS and extends L

// --- Leaflet Default Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
// --- End Icon Fix ---

// --- Define Custom Icons ---
const createVehicleIcon = (iconUrl, size = [38, 38], anchor = [size[0] / 2, size[1]]) => {
    // Anchor is typically [halfOfWidth, fullHeight] for bottom-center
    // Popup anchor is [0, -fullHeight] to appear above the tip of the icon
    if (!iconUrl) {
        console.warn("[MapComponent-createVehicleIcon] iconUrl is missing. Using Leaflet default.");
        return new L.Icon.Default();
    }
    try {
        return L.icon({
            iconUrl: iconUrl,
            iconSize: size,
            iconAnchor: anchor,
            popupAnchor: [0, -anchor[1] + (size[1] - anchor[1]) - 5 ] // Adjust -5 for slight offset above icon
        });
    } catch (e) {
        console.error("[MapComponent-createVehicleIcon] Error creating L.icon for:", iconUrl, e);
        return new L.Icon.Default();
    }
};

// Pre-create icons
const iconRegistry = {
    car: createVehicleIcon('/icons/car.png', [32, 32]), // Adjusted sizes for potentially better look
    bike: createVehicleIcon('/icons/bike.png', [28, 28]),
    truck: createVehicleIcon('/icons/truck.png', [40, 40]),
    van: createVehicleIcon('/icons/van.png', [35, 35]),
    bus: createVehicleIcon('/icons/bus.png', [38, 38]),
    ambulance: createVehicleIcon('/icons/ambulance.png', [35, 35]),
    rickshaw: createVehicleIcon('/icons/rickshaw.png', [30, 30]),
    hotairballoon: createVehicleIcon('/icons/hotairballoon.png', [45, 45]),
    default: createVehicleIcon('/icons/default-vehicle.png', [30, 30]),
    placeholder: createVehicleIcon('/icons/placeholder-suv.png', [32, 32]),
    safeDefault: new L.Icon.Default(), // For absolute fallback
};

const getIconForVehicle = (vehicle) => {
    if (!vehicle || !vehicle.vehicle_type) return iconRegistry.default;
    const type = String(vehicle.vehicle_type).toLowerCase();

    if (type.includes('ambulance')) return iconRegistry.ambulance || iconRegistry.default;
    if (type.includes('hot air ballon') || type.includes('hotairballon')) return iconRegistry.hotairballoon || iconRegistry.default;
    if (type.includes('rickshaw')) return iconRegistry.rickshaw || iconRegistry.default;
    if (type.includes('truck') || type.includes('mixer') || type.includes('handler') || type.includes('dumper') || type.includes('trailer') || type.includes('ecomet')) return iconRegistry.truck || iconRegistry.default;
    if (type.includes('bus')) return iconRegistry.bus || iconRegistry.default;
    if (type.includes('van') || type.includes('tempo') || type.includes('campervan')) return iconRegistry.van || iconRegistry.default;
    if (type.includes('bike') || type.includes('motorcycle')) return iconRegistry.bike || iconRegistry.default;
    if (type.includes('car') || type.includes('suv') || type.includes('muv') || type.includes('hatchback') || type === 'mercedes') return iconRegistry.car || iconRegistry.default;
    if (type.includes('default')) return iconRegistry.default;
    
    // console.warn(`[MapComponent-getIcon] No specific icon for type: "${type}". Using placeholder.`);
    return iconRegistry.placeholder || iconRegistry.default;
};

// --- Vehicle Markers Layer Component with Clustering ---
const VehicleMarkersLayer = ({ vehiclesToShow, onVehicleClick }) => {
    const map = useMap();
    const clusterGroupRef = useRef(null); // Ref for the L.MarkerClusterGroup instance

    useEffect(() => {
        if (!map) return;

        // Initialize MarkerClusterGroup if it doesn't exist
        if (!clusterGroupRef.current) {
            clusterGroupRef.current = L.markerClusterGroup({
                // --- MarkerClusterGroup Options (customize as needed) ---
                // spiderfyOnMaxZoom: true, // Show individual markers when zoomed in fully, even if overlapping
                // showCoverageOnHover: true, // Show the bounds of a cluster on hover
                // zoomToBoundsOnClick: true, // Zoom to bounds of cluster on click
                // disableClusteringAtZoom: 17, // Stop clustering at this zoom level
                // maxClusterRadius: 80, // The maximum radius that a cluster will cover from the central marker (in pixels)
                // animateAddingMarkers: true, // Animate when adding markers (can be performance intensive for many)
                // chunkedLoading: true, // Process markers in chunks for better performance with large datasets
                // chunkInterval: 200, // Interval in ms for chunkedLoading
                // chunkDelay: 50, // Delay in ms after each chunk for chunkedLoading
                // Other options: iconCreateFunction for custom cluster icons, polygonOptions for spiderfy polygons, etc.
            });
            map.addLayer(clusterGroupRef.current);
            // console.log("[MapComponent] MarkerClusterGroup initialized and added to map.");
        }

        const clusterGroup = clusterGroupRef.current;
        const newLeafletMarkers = [];

        vehiclesToShow.forEach(vehicle => {
            if (vehicle && typeof vehicle.latitude === 'number' && typeof vehicle.longitude === 'number' && vehicle.id) {
                const position = [vehicle.latitude, vehicle.longitude];
                const icon = getIconForVehicle(vehicle);

                if (!icon || typeof icon.createIcon !== 'function') {
                    console.error(`[MapComponent-VehicleMarkersLayer] Invalid icon for vehicle ${vehicle.id}. Using Leaflet default.`);
                    // The getIconForVehicle should already return a valid default, but as a last resort:
                    // icon = new L.Icon.Default(); 
                }
                
                const marker = L.marker(position, { icon });
                marker.bindPopup(`<b>${vehicle.vehicle_no || vehicle.id}</b><br>Status: ${vehicle.status || 'N/A'}<br>Speed: ${vehicle.speed !== undefined ? vehicle.speed + ' km/h' : 'N/A'}`);
                
                marker.on('click', (e) => {
                    L.DomEvent.stopPropagation(e); // Prevent map click if any
                    if (onVehicleClick) {
                        onVehicleClick(vehicle); // Pass the original vehicle data object
                    }
                });
                newLeafletMarkers.push(marker);
            } else {
                // console.warn('[MapComponent-VehicleMarkersLayer] Skipping vehicle due to missing/invalid data:', vehicle);
            }
        });

        // Efficiently update the cluster group
        clusterGroup.clearLayers(); // Remove all existing markers from the cluster group
        if (newLeafletMarkers.length > 0) {
            clusterGroup.addLayers(newLeafletMarkers); // Add the new set of markers
            // console.log(`[MapComponent-VehicleMarkersLayer] Added ${newLeafletMarkers.length} markers to MarkerClusterGroup.`);
        }

        // Cleanup for when the component unmounts OR map instance changes
        // If the layer is simply toggled (hidden/shown), this useEffect might re-run.
        // The current logic re-initializes the cluster group if map changes.
        return () => {
            if (map && clusterGroupRef.current && map.hasLayer(clusterGroupRef.current)) {
                // console.log("[MapComponent-VehicleMarkersLayer] Cleaning up MarkerClusterGroup from map.");
                // If you want the cluster group to be completely removed when the layer is hidden/component unmounts:
                // clusterGroup.clearLayers();
                // map.removeLayer(clusterGroupRef.current);
                // clusterGroupRef.current = null;
                // For now, let's just clear layers. Re-adding the group is handled if it's null.
                 clusterGroup.clearLayers();
            }
        };
    }, [vehiclesToShow, map, onVehicleClick]); // Rerun when these dependencies change

    return null; // This component only manages Leaflet layers directly
};


// --- Main Map Component Definition ---
const MapComponent = ({ whenReady, showVehiclesLayer, vehicleData, onVehicleClick }) => {
    // Note: 'vehicleData' prop from page.js is 'currentVehicles' in the simplified version
    // For clustering, we don't need 'previousVehicles' or 'animationDuration'
    const defaultPosition = [24.8607, 67.0011]; // Karachi, Pakistan
    const [mapInstance, setMapInstance] = useState(null);

    // Helper component to access the map instance via useMap() hook
    const MapInstanceAccess = () => {
        const map = useMap();
        useEffect(() => {
            if (map) {
                setMapInstance(map); // Set the map instance for the parent
                if (whenReady) {
                    whenReady(map); // Call the callback passed from page.js
                }
            }
        }, [map]); // Effect runs when map instance is available/changes
        return null;
    };

    // Flatten all vehicle data from the categorized object into a single array
    // This is what VehicleMarkersLayer expects for 'vehiclesToShow'
    const allVehiclesList = vehicleData && typeof vehicleData === 'object'
        ? Object.values(vehicleData).flat().filter(v => v && v.id && typeof v.latitude === 'number' && typeof v.longitude === 'number')
        : [];
    
    // console.log('[MapComponent] Rendering. Total vehicles in list:', allVehiclesList.length);

    const mapPlaceholder = (
        <div style={{ height: "100%", width: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee', color: '#333' }}>
            Loading Map...
        </div>
    );

    return (
        <MapContainer
            center={defaultPosition}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            // whenCreated can also be used here instead of MapInstanceAccess if preferred
            // whenCreated={(map) => {
            //     setMapInstance(map);
            //     if (whenReady) whenReady(map);
            // }}
            placeholder={mapPlaceholder}
        >
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapInstanceAccess /> 
            
            {showVehiclesLayer && mapInstance && ( // Ensure mapInstance exists before rendering layer
                <VehicleMarkersLayer 
                    vehiclesToShow={allVehiclesList} 
                    onVehicleClick={onVehicleClick} 
                />
            )}
        </MapContainer>
    );
};

export default MapComponent;