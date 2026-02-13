// src/components/MapComponent.js
"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MapControls from "@/components/MapControls";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

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

// --- Draw Control (Unchanged) ---
const GeofenceDrawControl = ({ onGeofenceCreated }) => {
  const map = useMap();

  useEffect(() => {
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: { shapeOptions: { color: "#f357a1" } },
        circle: { shapeOptions: { color: "#f357a1" } },
        polyline: false,
        rectangle: false,
        marker: false,
      },
      edit: false,
    });

    map.addControl(drawControl);

    const handleDrawCreated = (e) => {
      const { layerType, layer } = e;
      if (!onGeofenceCreated) return;

      let geofenceData = { type: "", data: {} };

      if (layerType === "polygon") {
        geofenceData.type = "Polygon";
        const geoJson = layer.toGeoJSON();
        geofenceData.data = { coordinates: geoJson.geometry.coordinates };
      } else if (layerType === "circle") {
        geofenceData.type = "Circle";
        const center = layer.getLatLng();
        geofenceData.data = {
          center: { lat: center.lat, lng: center.lng },
          radius: layer.getRadius(),
        };
      }

      onGeofenceCreated(geofenceData);
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  }, [map, onGeofenceCreated]);

  return null;
};

// --- Display Layer (Unchanged) ---
const GeofenceDisplayLayer = ({ geofences }) => {
  const map = useMap();

  useEffect(() => {
    const geofenceLayerGroup = L.layerGroup();

    if (geofences && geofences.length > 0) {
      geofences.forEach((geofence) => {
        let shape;
        const options = { color: "#ff7800", weight: 3, fillOpacity: 0.15 };

        if (geofence.type === "Polygon" && geofence.polygon?.coordinates) {
          const leafletCoords = geofence.polygon.coordinates[0].map((p) => [p[1], p[0]]);
          shape = L.polygon(leafletCoords, options);
        } else if (geofence.type === "Circle" && geofence.circle?.center) {
          shape = L.circle([geofence.circle.center.lat, geofence.circle.center.lng], {
            ...options,
            radius: geofence.circle.radius,
          });
        }

        if (shape) {
          shape.bindTooltip(geofence.name || "Unnamed Geofence", {
            permanent: true,
            direction: "center",
            className: "geofence-label",
          });
          geofenceLayerGroup.addLayer(shape);
        }
      });
    }

    geofenceLayerGroup.addTo(map);

    return () => {
      map.removeLayer(geofenceLayerGroup);
    };
  }, [map, geofences]);

  return null;
};

// --- Bearing + rotated divIcon (Unchanged logic, but no per-frame React setState) ---
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
  const x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

const createRotatedDivIcon = (leafletIcon, rotation) => {
  const { iconUrl, iconSize } = leafletIcon.options;
  if (!iconUrl || !iconSize) return iconRegistry.safeDefault;

  return L.divIcon({
    html: `<img src="${iconUrl}" style="transform-origin:center;transform:rotate(${rotation}deg);width:${iconSize[0]}px;height:${iconSize[1]}px;" />`,
    className: "leaflet-rotated-icon",
    iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
    popupAnchor: [0, -iconSize[1] / 2],
  });
};

// --- Optimized Animated marker (rotation updates only when segment changes) ---
const AnimatedMarker = ({ vehicle, position, rotation, onVehicleClick, markerRef }) => {
  const baseIcon = getIconForVehicle(vehicle);
  const rotatedIcon = createRotatedDivIcon(baseIcon, rotation);

  return (
    <Marker
      position={position}
      icon={rotatedIcon}
      ref={markerRef}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onVehicleClick?.(vehicle);
        },
      }}
    >
      <Popup>
        <b>{vehicle.vehicle_no || vehicle.imei_id}</b>
        <br />
        Speed: {vehicle.speed ?? "N/A"} km/h
      </Popup>
    </Marker>
  );
};

// --- Optimized VehicleAnimator: NO OSRM, NO per-frame React state ---
const VehicleAnimator = ({ vehicle, onVehicleClick }) => {
  const hasInitialPosition = vehicle?.latitude != null && vehicle?.longitude != null;

  // Prepare path once (remove consecutive duplicates)
  const uniqueGpsPath = useMemo(() => {
    if (!vehicle.path || vehicle.path.length === 0) return [];
    return vehicle.path.filter((point, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      return point.latitude !== prev.latitude || point.longitude !== prev.longitude;
    });
  }, [vehicle.path]);

  const trackPositions = useMemo(() => {
    // Keep track line visible (design preserved)
    return uniqueGpsPath.map((p) => [p.latitude, p.longitude]);
  }, [uniqueGpsPath]);

  const markerRef = useRef(null);
  const rafRef = useRef(null);

  // local refs (no React rerender)
  const idxRef = useRef(0);
  const segmentStartRef = useRef(null);
  const rotationRef = useRef(vehicle.angle_name || 0);

  // Initial marker position
  const initialPos = useMemo(() => {
    if (!hasInitialPosition) return null;
    return [vehicle.latitude, vehicle.longitude];
  }, [hasInitialPosition, vehicle.latitude, vehicle.longitude]);

  // Only animate if we have a path
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    idxRef.current = 0;
    segmentStartRef.current = null;

    const path = uniqueGpsPath;
    if (!path || path.length < 2) return;

    const totalAnimationDuration = 15000;
    const segmentDuration = totalAnimationDuration / (path.length - 1);

    const tick = (ts) => {
      if (!segmentStartRef.current) segmentStartRef.current = ts;

      const start = path[idxRef.current];
      const end = path[idxRef.current + 1];

      // Update rotation only when we’re on a segment
      rotationRef.current = getBearing(
        [start.latitude, start.longitude],
        [end.latitude, end.longitude]
      );

      const elapsed = ts - segmentStartRef.current;
      const progress = Math.min(elapsed / segmentDuration, 1);

      const lat = start.latitude + (end.latitude - start.latitude) * progress;
      const lng = start.longitude + (end.longitude - start.longitude) * progress;

      // Move leaflet marker directly (no React state updates)
      const leafletMarker = markerRef.current;
      if (leafletMarker && leafletMarker.setLatLng) {
        leafletMarker.setLatLng([lat, lng]);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        idxRef.current += 1;
        segmentStartRef.current = null;

        if (idxRef.current < path.length - 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [uniqueGpsPath, vehicle.imei_id]);

  // Render
  if (!initialPos) return null;

  if (trackPositions.length >= 2) {
    return (
      <>
        <Polyline positions={trackPositions} color="dodgerblue" weight={4} opacity={0.7} />
        <AnimatedMarker
          vehicle={vehicle}
          position={initialPos}
          rotation={rotationRef.current}
          onVehicleClick={onVehicleClick}
          markerRef={markerRef}
        />
      </>
    );
  }

  return (
    <Marker
      position={initialPos}
      icon={getIconForVehicle(vehicle)}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onVehicleClick?.(vehicle);
        },
      }}
    >
      <Popup>
        <b>{vehicle.vehicle_no || vehicle.imei_id}</b> (Static)
      </Popup>
    </Marker>
  );
};

// --- Main Map Component ---
const MapComponent = ({
  whenReady,
  showVehiclesLayer = true,
  vehicleData,
  onVehicleClick,
  activeGroups,
  geofences,
  onGeofenceCreated,
  showBuiltInControls = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const mapRef = useRef(null);
  const mapKeyRef = useRef(`map-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  const vehiclesToShow = useMemo(() => {
    if (!vehicleData || typeof vehicleData !== "object") return [];

    const groupsToFilter =
      activeGroups && activeGroups.length > 0
        ? activeGroups
        : Object.keys(vehicleData);

    return groupsToFilter
      .filter((groupName) => vehicleData[groupName])
      .map((groupName) => vehicleData[groupName])
      .flat()
      .filter((v) => {
        if (!v || !v.imei_id) return false;
        const lat = Number(v.latitude);
        const lng = Number(v.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      });
  }, [vehicleData, activeGroups]);

  const handleMapReady = useCallback(
    (map) => {
      mapRef.current = map;
      setMapInstance(map);
      if (map?.zoomControl) {
        map.removeControl(map.zoomControl);
      }
      if (whenReady) {
        whenReady(map);
      }
    },
    [whenReady]
  );

  useEffect(() => {
    return () => {
      try {
        if (mapRef.current) {
          const container = mapRef.current.getContainer?.();
          mapRef.current.off();
          mapRef.current.remove();
          if (container) {
            // Clear Leaflet's internal container id to avoid re-init errors.
            container._leaflet_id = null;
            container.innerHTML = "";
          }
          mapRef.current = null;
        }
      } catch (error) {
        // no-op
      }
    };
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#eee",
          color: "#333",
        }}
      >
        Loading Map...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        key={mapKeyRef.current}
        center={[24.8607, 67.0011]}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={true}
        whenCreated={handleMapReady}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showVehiclesLayer &&
          mapInstance &&
          vehiclesToShow.map((vehicle) => (
            <VehicleAnimator
              key={vehicle.imei_id}
              vehicle={vehicle}
              onVehicleClick={onVehicleClick}
            />
          ))}

        {mapInstance && <GeofenceDisplayLayer geofences={geofences} />}
        {mapInstance && (
          <GeofenceDrawControl onGeofenceCreated={onGeofenceCreated} />
        )}
      </MapContainer>

      {/* RIGHT SIDE BLACK CONTROLS (always when mapInstance exists) */}
      {mapInstance && showBuiltInControls && (
        <MapControls
          onControlClick={() => {}}
          onZoomIn={() => mapInstance.zoomIn()}
          onZoomOut={() => mapInstance.zoomOut()}
        />
      )}
    </div>
  );
};

export default MapComponent;
