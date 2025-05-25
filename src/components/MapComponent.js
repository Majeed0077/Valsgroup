// src/components/MapComponent.js
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import MarkerCluster CSS & JS
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'; 
import 'leaflet.markercluster';

// --- Leaflet Default Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Define Custom Icons ---
const createVehicleIcon = (iconUrl, size = [38, 38], anchor = [size[0] / 2, size[1]]) => {
    if (!iconUrl) {
        return new L.Icon.Default();
    }
    try {
        return L.icon({
            iconUrl,
            iconSize: size,
            iconAnchor: anchor,
            popupAnchor: [0, -anchor[1] + (size[1] - anchor[1]) - 5]
        });
    } catch {
        return new L.Icon.Default();
    }
};

const iconRegistry = {
    car: createVehicleIcon('/icons/car.png', [32, 32]),
    bike: createVehicleIcon('/icons/bike.png', [28, 28]),
    truck: createVehicleIcon('/icons/truck.png', [40, 40]),
    van: createVehicleIcon('/icons/van.png', [35, 35]),
    bus: createVehicleIcon('/icons/bus.png', [38, 38]),
    ambulance: createVehicleIcon('/icons/ambulance.png', [35, 35]),
    rickshaw: createVehicleIcon('/icons/rickshaw.png', [30, 30]),
    hotairballoon: createVehicleIcon('/icons/hotairballoon.png', [45, 45]),
    default: createVehicleIcon('/icons/default-vehicle.png', [30, 30]),
    placeholder: createVehicleIcon('/icons/placeholder-suv.png', [32, 32]),
    safeDefault: new L.Icon.Default(),
};

const getIconForVehicle = (vehicle) => {
    if (!vehicle || !vehicle.vehicle_type) return iconRegistry.default;
    const type = String(vehicle.vehicle_type).toLowerCase();

    if (type.includes('ambulance')) return iconRegistry.ambulance;
    if (type.includes('hot air ballon') || type.includes('hotairballon')) return iconRegistry.hotairballoon;
    if (type.includes('rickshaw')) return iconRegistry.rickshaw;
    if (type.includes('truck') || type.includes('mixer') || type.includes('handler') || type.includes('dumper') || type.includes('trailer') || type.includes('ecomet')) return iconRegistry.truck;
    if (type.includes('bus')) return iconRegistry.bus;
    if (type.includes('van') || type.includes('tempo') || type.includes('campervan')) return iconRegistry.van;
    if (type.includes('bike') || type.includes('motorcycle')) return iconRegistry.bike;
    if (type.includes('car') || type.includes('suv') || type.includes('muv') || type.includes('hatchback') || type === 'mercedes') return iconRegistry.car;
    if (type.includes('default')) return iconRegistry.default;
    return iconRegistry.placeholder;
};

const VehicleMarkersLayer = ({ vehiclesToShow, onVehicleClick }) => {
    const map = useMap();
    const clusterGroupRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        if (!clusterGroupRef.current) {
            clusterGroupRef.current = L.markerClusterGroup();
            map.addLayer(clusterGroupRef.current);
        }

        const clusterGroup = clusterGroupRef.current;
        const markers = [];

        vehiclesToShow.forEach(vehicle => {
            if (vehicle && typeof vehicle.latitude === 'number' && typeof vehicle.longitude === 'number' && vehicle.id) {
                const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon: getIconForVehicle(vehicle) });
                marker.bindPopup(`<b>${vehicle.vehicle_no || vehicle.id}</b><br>Status: ${vehicle.status || 'N/A'}<br>Speed: ${vehicle.speed !== undefined ? vehicle.speed + ' km/h' : 'N/A'}`);
                marker.on('click', e => {
                    L.DomEvent.stopPropagation(e);
                    if (onVehicleClick) onVehicleClick(vehicle);
                });
                markers.push(marker);
            }
        });

        clusterGroup.clearLayers();
        if (markers.length) clusterGroup.addLayers(markers);

        return () => {
            clusterGroup.clearLayers();
        };
    }, [vehiclesToShow, map, onVehicleClick]);

    return null;
};

const MapInstanceAccess = ({ onMapReady }) => {
    const map = useMap();
    useEffect(() => {
        if (map && onMapReady) onMapReady(map);
    }, [map, onMapReady]);
    return null;
};

const MapComponent = ({ whenReady, showVehiclesLayer, vehicleData, onVehicleClick }) => {
    const [mounted, setMounted] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const allVehiclesList = vehicleData && typeof vehicleData === 'object'
        ? Object.values(vehicleData).flat().filter(v => v && v.id && typeof v.latitude === 'number' && typeof v.longitude === 'number')
        : [];

    if (!mounted) {
        return (
            <div style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee', color: '#333' }}>
                Loading Map...
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <MapContainer
                center={[24.8607, 67.0011]}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapInstanceAccess onMapReady={(map) => {
                    setMapInstance(map);
                    if (whenReady) whenReady(map);
                }} />
                {showVehiclesLayer && mapInstance && (
                    <VehicleMarkersLayer vehiclesToShow={allVehiclesList} onVehicleClick={onVehicleClick} />
                )}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
