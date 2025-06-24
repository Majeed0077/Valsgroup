// src/components/MapComponent.js
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// NOTE: MarkerCluster library is no longer used and can be removed from package.json
// It is replaced by individual vehicle animation.

// --- Leaflet Default Icon Fix (Unchanged) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// --- Define Custom Icons (Unchanged) ---
const createVehicleIcon = (iconUrl, size = [38, 38], anchor = [size[0] / 2, size[1]]) => {
    if (!iconUrl) return new L.Icon.Default();
    return L.icon({ iconUrl, iconSize: size, iconAnchor: anchor, popupAnchor: [0, -anchor[1]] });
};

const iconRegistry = {
  car: createVehicleIcon("/icons/car.png", [32, 32]),
  bike: createVehicleIcon("/icons/bike.png", [28, 28]),
  truck: createVehicleIcon("/icons/truck.png", [40, 40]),
  van: createVehicleIcon("/icons/van.png", [35, 35]),
  bus: createVehicleIcon("/icons/bus.png", [38, 38]),
  ambulance: createVehicleIcon("/icons/ambulance.png", [35, 35]),
  rickshaw: createVehicleIcon("/icons/rickshaw.png", [30, 30]),
  hotairballoon: createVehicleIcon("/icons/hotairballoon.png", [45, 45]),
  default: createVehicleIcon("/icons/default-vehicle.png", [30, 30]),
  placeholder: createVehicleIcon("/icons/placeholder-suv.png", [32, 32]),
  safeDefault: new L.Icon.Default(),
};

const getIconForVehicle = (vehicle) => {
  if (!vehicle || !vehicle.vehicle_type) return iconRegistry.default;
  const type = String(vehicle.vehicle_type).toLowerCase();
  if (type.includes("ambulance")) return iconRegistry.ambulance;
  if (type.includes("hot air ballon") || type.includes("hotairballon")) return iconRegistry.hotairballoon;
  if (type.includes("rickshaw")) return iconRegistry.rickshaw;
  if (type.includes("truck") || type.includes("mixer") || type.includes("handler") || type.includes("dumper") || type.includes("trailer") || type.includes("ecomet")) return iconRegistry.truck;
  if (type.includes("bus")) return iconRegistry.bus;
  if (type.includes("van") || type.includes("tempo") || type.includes("campervan")) return iconRegistry.van;
  if (type.includes("bike") || type.includes("motorcycle")) return iconRegistry.bike;
  if (type.includes("car") || type.includes("suv") || type.includes("muv") || type.includes("hatchback") || type === "mercedes") return iconRegistry.car;
  if (type.includes("default")) return iconRegistry.default;
  return iconRegistry.placeholder;
};


// --- Animation Helper Functions ---
function getBearing(start, end) {
  const [lat1, lon1] = start; const [lat2, lon2] = end;
  const toRadians = (deg) => deg * (Math.PI / 180); const toDegrees = (rad) => rad * (180 / Math.PI);
  const startLat = toRadians(lat1), startLng = toRadians(lon1), destLat = toRadians(lat2), destLng = toRadians(lon2);
  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

const createRotatedDivIcon = (leafletIcon, rotation) => {
  const { iconUrl, iconSize } = leafletIcon.options;
  if (!iconUrl || !iconSize) return iconRegistry.safeDefault;
  return L.divIcon({
    html: `<img src="${iconUrl}" style="transform-origin: center; transform: rotate(${rotation}deg); width: ${iconSize[0]}px; height: ${iconSize[1]}px;" />`,
    className: "leaflet-rotated-icon", iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
    popupAnchor: [0, -iconSize[1] / 2],
  });
};

// --- Animation Components ---
const AnimatedMarker = ({ vehicle, position, previousPosition, onVehicleClick }) => {
  const rotation = position && previousPosition && (position[0] !== previousPosition[0] || position[1] !== previousPosition[1]) ? getBearing(previousPosition, position) : vehicle.angle_name || 0; // Use angle_name if available
  const baseIcon = getIconForVehicle(vehicle);
  const rotatedIcon = createRotatedDivIcon(baseIcon, rotation);
  return <Marker position={position} icon={rotatedIcon} eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onVehicleClick?.(vehicle); } }}><Popup><b>{vehicle.vehicle_no || vehicle.imei_id}</b><br/>Speed: {vehicle.speed ?? "N/A"} km/h</Popup></Marker>;
};

const VehicleAnimator = ({ vehicle, onVehicleClick }) => {
  const [position, setPosition] = useState([vehicle.latitude, vehicle.longitude]);
  const [previousPosition, setPreviousPosition] = useState(null);
  const animationFrameId = useRef(null);
  const pathIndex = useRef(0);
  const animationStartTime = useRef(null);
  const path = vehicle.path || [];

  useEffect(() => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    pathIndex.current = 0; animationStartTime.current = null;
    setPosition([vehicle.latitude, vehicle.longitude]); setPreviousPosition(null);
    if (path.length < 2) return;
    const segmentDuration = 5000; // Animate over 5 seconds per segment
    const animate = (timestamp) => {
      if (!animationStartTime.current) animationStartTime.current = timestamp;
      const elapsedTime = timestamp - animationStartTime.current;
      const progress = Math.min(elapsedTime / segmentDuration, 1);
      const startPoint = path[pathIndex.current]; const endPoint = path[pathIndex.current + 1];
      const lat = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * progress;
      const lng = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * progress;
      setPreviousPosition(position); setPosition([lat, lng]);
      if (progress < 1) animationFrameId.current = requestAnimationFrame(animate);
      else {
        pathIndex.current++; animationStartTime.current = null;
        if (pathIndex.current < path.length - 1) animationFrameId.current = requestAnimationFrame(animate);
        else setPosition([endPoint.latitude, endPoint.longitude]);
      }
    };
    animationFrameId.current = requestAnimationFrame(animate);
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [vehicle.path, vehicle.id]); // Re-run animation if path or vehicle ID changes

  // Renders a static marker if no valid path exists
  if (path.length < 2) {
    return <Marker position={[vehicle.latitude, vehicle.longitude]} icon={getIconForVehicle(vehicle)} eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onVehicleClick?.(vehicle); } }}><Popup><b>{vehicle.vehicle_no || vehicle.imei_id}</b> (Static)<br/>Status: {vehicle.sleep_mode_desc ?? 'N/A'}</Popup></Marker>;
  }

  // Renders the animated marker and its trail
  return <><Polyline positions={path.map(p => [p.latitude, p.longitude])} color="dodgerblue" weight={4} opacity={0.7} /><AnimatedMarker vehicle={vehicle} position={position} previousPosition={previousPosition} onVehicleClick={onVehicleClick} /></>;
};

// --- Map Instance Access (Unchanged) ---
const MapInstanceAccess = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => { if (map && onMapReady) onMapReady(map); }, [map, onMapReady]);
  return null;
};

// --- Main Map Component ---
const MapComponent = ({ whenReady, showVehiclesLayer = true, vehicleData, onVehicleClick, activeGroups }) => {
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  const vehiclesToShow = useMemo(() => {
    if (!vehicleData || typeof vehicleData !== 'object') return [];
    
    const groupsToFilter = (activeGroups && activeGroups.length > 0)
      ? activeGroups
      : Object.keys(vehicleData);

    return groupsToFilter
      .filter(groupName => vehicleData[groupName])
      .map(groupName => vehicleData[groupName])
      .flat()
      .filter(v => v && v.imei_id && typeof v.latitude === 'number' && typeof v.longitude === 'number');
  }, [vehicleData, activeGroups]);

  if (!mounted) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#eee", color: "#333" }}>
        Loading Map...
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "calc(100vw - 140px)", marginLeft: "-260px" }}>
      <MapContainer center={[24.8607, 67.0011]} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapInstanceAccess onMapReady={(map) => { setMapInstance(map); if (whenReady) whenReady(map); }} />
        
        {/* REPLACED MarkerCluster with individual VehicleAnimators */}
        {showVehiclesLayer && mapInstance && vehiclesToShow.map((vehicle) => (
            <VehicleAnimator
              key={vehicle.imei_id} // Use the unique and stable imei_id as the key
              vehicle={vehicle}
              onVehicleClick={onVehicleClick}
            />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;