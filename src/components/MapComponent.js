"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {MapContainer,TileLayer,useMap,Marker,Popup,Polyline,} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// NOTE: MarkerCluster library is no longer used and can be removed from package.json
// It is replaced by individual vehicle animation.

// --- Leaflet Default Icon Fix (Unchanged) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-ic xon.png",
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

// --- UPDATED VehicleAnimator with Road Snapping ---
const VehicleAnimator = ({ vehicle, onVehicleClick }) => {
  const [position, setPosition] = useState([vehicle.latitude, vehicle.longitude]);
  const [previousPosition, setPreviousPosition] = useState(null);
  
  // State to hold the new, high-quality road-snapped path
  const [snappedPath, setSnappedPath] = useState([]);
  
  const animationFrameId = useRef(null);
  const pathIndex = useRef(0);
  const animationStartTime = useRef(null);

  // 1. Pre-process the original GPS path to remove consecutive duplicates.
  const uniqueGpsPath = useMemo(() => {
    if (!vehicle.path || vehicle.path.length === 0) return [];
    return vehicle.path.filter((point, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      return point.latitude !== prev.latitude || point.longitude !== prev.longitude;
    });
  }, [vehicle.path]);

  // 2. Fetch the road-snapped path from OSRM when the unique GPS path changes.
  useEffect(() => {
    if (uniqueGpsPath.length > 1) {
      getSnappedPathFromOSRM(uniqueGpsPath).then(newPath => {
        setSnappedPath(newPath);
      });
    } else {
      setSnappedPath(uniqueGpsPath); // If not enough points, just use the original
    }
  }, [uniqueGpsPath]);

  // 3. Run the animation along the new, high-quality SNAPPED path.
  useEffect(() => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    
    pathIndex.current = 0;
    animationStartTime.current = null;
    setPosition([vehicle.latitude, vehicle.longitude]);
    setPreviousPosition(null);

    if (snappedPath.length < 2) return;

    const totalAnimationDuration = 15000; // 15 seconds for the whole path
    const segmentDuration = totalAnimationDuration / (snappedPath.length - 1);

    const animate = (timestamp) => {
      if (!animationStartTime.current) animationStartTime.current = timestamp;
      const elapsedTime = timestamp - animationStartTime.current;
      const progress = Math.min(elapsedTime / segmentDuration, 1);

      const startPoint = snappedPath[pathIndex.current]; 
      const endPoint = snappedPath[pathIndex.current + 1];

      const lat = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * progress;
      const lng = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * progress;
      
      setPreviousPosition(position);
      setPosition([lat, lng]);

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        pathIndex.current++;
        animationStartTime.current = null;
        if (pathIndex.current < snappedPath.length - 1) {
          animationFrameId.current = requestAnimationFrame(animate);
        } else {
          setPosition([endPoint.latitude, endPoint.longitude]);
        }
      }
    };
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [snappedPath, vehicle.imei_id]); // The animation now depends on the snappedPath

  // Render logic for static vs. animated markers
  if (snappedPath.length < 2) {
    return <Marker position={[vehicle.latitude, vehicle.longitude]} icon={getIconForVehicle(vehicle)} eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onVehicleClick?.(vehicle); } }}><Popup><b>{vehicle.vehicle_no || vehicle.imei_id}</b> (Static)</Popup></Marker>;
  }

  return (
    <>
      {/* FIX: The vehicle track is back, and it now draws the road-snapped path! */}
      <Polyline positions={snappedPath.map(p => [p.latitude, p.longitude])} color="dodgerblue" weight={4} opacity={0.7} />
      <AnimatedMarker vehicle={vehicle} position={position} previousPosition={previousPosition} onVehicleClick={onVehicleClick} />
    </>
  );
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
// --- NEW: OSRM Routing Function for Road Snapping ---
async function getSnappedPathFromOSRM(points) {
  if (points.length < 2) return points; // Cannot route with less than 2 points

  // Format coordinates for OSRM API: {longitude},{latitude};{longitude},{latitude}
  const coordinates = points.map(p => `${p.longitude},${p.latitude}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      // OSRM returns [lng, lat], Leaflet needs [lat, lng]. We swap them here.
      const snappedCoords = data.routes[0].geometry.coordinates.map(coord => ({latitude: coord[1], longitude: coord[0]}));
      return snappedCoords;
    } else {
      console.warn("OSRM routing failed, falling back to straight line path.", data.message);
      return points; // Fallback to the original path if routing fails
    }
  } catch (error) {
    console.error("Error fetching from OSRM:", error);
    return points; // Fallback on network error
  }
}
