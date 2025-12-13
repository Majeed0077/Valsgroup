// src/components/AnimatedMarker.js
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// --- Bearing Calculation ---
const getBearing = ([lat1, lon1], [lat2, lon2]) => {
  const toRad = deg => deg * Math.PI / 180;
  const toDeg = rad => rad * 180 / Math.PI;

  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

// --- Optimized Icon Factory ---
const createRotatedIcon = (vehicleType, rotation) => {
  const iconUrl = `/icons/${vehicleType}.png`;
  return L.divIcon({
    html: `<img src="${iconUrl}" style="
      transform: rotate(${rotation}deg);
      width: 32px;
      height: 32px;
      transition: transform 0.3s linear;" />`,
    className: 'leaflet-vehicle-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const AnimatedMarker = ({ vehicle, position, previousPosition }) => {
  const markerRef = useRef(null);

  const vehicleType = useMemo(() => {
    const type = vehicle.vehicle_type?.toLowerCase() || 'default';
    return type.includes('car') ? 'car' : type.includes('truck') ? 'truck' : 'default';
  }, [vehicle.vehicle_type]);

  const rotation = useMemo(() => {
    return previousPosition ? getBearing(previousPosition, position) : 0;
  }, [position, previousPosition]);

  const icon = useMemo(() => createRotatedIcon(vehicleType, rotation), [vehicleType, rotation]);

  // 🔄 Smoothly update marker position and icon without re-render
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);

      // Update icon (rotation) manually
      if (icon) {
        markerRef.current.setIcon(icon);
      }
    }
  }, [position, icon]);

  return (
    <Marker position={position} icon={icon}>
    <Popup>
      <strong>Vehicle:</strong> {vehicle.vehicle_no || vehicle.imeino} <br />
      <strong>Speed:</strong> {vehicle.speed || 'N/A'} km/h <br />
      <strong>Status:</strong> {vehicle.movement_status || 'Unknown'}
    </Popup>
  </Marker>
    
  );
};

export default AnimatedMarker;
