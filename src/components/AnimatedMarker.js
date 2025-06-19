// src/components/AnimatedMarker.js
import React, { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Helper function to calculate bearing between two points
function getBearing(start, end) {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const toRadians = (deg) => deg * (Math.PI / 180);
  const toDegrees = (rad) => rad * (180 / Math.PI);

  const startLat = toRadians(lat1);
  const startLng = toRadians(lon1);
  const destLat = toRadians(lat2);
  const destLng = toRadians(lon2);

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x = Math.cos(startLat) * Math.sin(destLat) -
          Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let brng = Math.atan2(y, x);
  brng = toDegrees(brng);
  return (brng + 360) % 360;
}

// Custom DivIcon for rotation
const createRotatedIcon = (vehicleType, rotation) => {
  const iconUrl = `/icons/${vehicleType}.png`; // Assumes you have icons like car.png, truck.png
  return L.divIcon({
    html: `<img src="${iconUrl}" style="transform: rotate(${rotation}deg); width: 32px; height: 32px;" />`,
    className: 'leaflet-rotated-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const AnimatedMarker = ({ vehicle, position, previousPosition }) => {
  const markerRef = useRef(null);
  const rotation = previousPosition ? getBearing(previousPosition, position) : 0;
  const vehicleType = vehicle.vehicle_type?.toLowerCase() || 'default';

  const icon = createRotatedIcon(vehicleType.includes('car') ? 'car' : 'truck', rotation); // Add more types

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      <Popup>
        <strong>Vehicle:</strong> {vehicle.vehicle_no || vehicle.imeino} <br />
        <strong>Speed:</strong> {vehicle.speed || 'N/A'} km/h
      </Popup>
    </Marker>
  );
};

export default AnimatedMarker;