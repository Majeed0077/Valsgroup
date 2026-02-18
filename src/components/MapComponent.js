// src/components/MapComponent.js
"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  Circle,
} from "react-leaflet";
import MapControls from "@/components/MapControls";
import L from "leaflet";
import "leaflet-draw";
import "leaflet.markercluster";
import { fetchSnapppedRoute } from "@/utils/osrm";

const MAX_MAP_ZOOM = 20;

const TILE_CONFIG = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: MAX_MAP_ZOOM,
  },
  google_roadmap: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "Map data © Google",
    maxZoom: MAX_MAP_ZOOM,
  },
  google_satellite: {
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: "Imagery © Google",
    maxZoom: MAX_MAP_ZOOM,
  },
  google_hybrid: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "Imagery © Google",
    maxZoom: MAX_MAP_ZOOM,
  },
  google_terrain: {
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    attribution: "Map data © Google",
    maxZoom: MAX_MAP_ZOOM,
  },
};

const TRAFFIC_TILE_CONFIG = {
  url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  attribution: '&copy; OpenStreetMap contributors, HOT style',
};

const SATELLITE_LABELS_CONFIG = {
  url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  attribution:
    "Labels &copy; Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), OpenStreetMap contributors, and the GIS User Community",
};

const SATELLITE_DETAIL_LABELS_CONFIG = {
  url: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: "abcd",
};

const MAP_TYPE_ALIASES = {
  default: "osm",
  satellite: "google_satellite",
};

// --- Leaflet Default Icon Fix (Unchanged) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// --- Define Custom Icons ---
const createVehicleIcon = (iconUrl, size = [30, 30], anchor = [size[0] / 2, size[1] / 2]) => {
  if (!iconUrl) return new L.Icon.Default();
  return L.icon({ iconUrl, iconSize: size, iconAnchor: anchor, popupAnchor: [0, -anchor[1]] });
};

const iconRegistry = {
  car: createVehicleIcon("/icons/car.png", [34, 34]),
  bike: createVehicleIcon("/icons/bike.png", [30, 30]),
  truck: createVehicleIcon("/icons/truck.png", [38, 38]),
  van: createVehicleIcon("/icons/van.png", [34, 34]),
  bus: createVehicleIcon("/icons/bus.png", [38, 38]),
  ambulance: createVehicleIcon("/icons/ambulance.png", [34, 34]),
  rickshaw: createVehicleIcon("/icons/rickshaw.png", [30, 30]),
  hotairballoon: createVehicleIcon("/icons/hotairballoon.png", [34, 34]),
  default: createVehicleIcon("/icons/default-vehicle.png", [34, 34]),
  placeholder: createVehicleIcon("/icons/placeholder-suv.png", [34, 34]),
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
      position: "topleft",
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

const toRad = (deg) => (deg * Math.PI) / 180;
const haversineMeters = (a, b) => {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

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

const userLocationIcon = L.divIcon({
  className: "user-location-pin-wrapper",
  html: `
    <div class="user-location-pin">
      <span class="user-location-core"></span>
      <span class="user-location-pulse"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const createClusterIcon = (count) => {
  const sizeClass =
    count >= 100 ? "vtp-cluster-xl" : count >= 20 ? "vtp-cluster-lg" : count >= 10 ? "vtp-cluster-md" : "vtp-cluster-sm";
  const displayCount = count > 999 ? "999+" : String(count);
  const sizePx =
    count >= 100 ? 62 : count >= 20 ? 56 : count >= 10 ? 50 : 44;
  const anchor = Math.round(sizePx / 2);

  return L.divIcon({
    html: `
      <div class="vtp-cluster-shell ${sizeClass}">
        <span class="vtp-cluster-count">${displayCount}</span>
      </div>
    `,
    className: "vtp-cluster-wrap",
    iconSize: [sizePx, sizePx],
    iconAnchor: [anchor, anchor],
  });
};

const CLUSTER_SWITCH_ZOOM = 11;

const getVehicleStatusKey = (vehicle) => {
  const status = String(vehicle?.movement_status || "").toLowerCase();
  const speed = Number(vehicle?.speed ?? 0);
  if (status.includes("run")) return "running";
  if (status.includes("idle")) return "idle";
  if (status.includes("stop")) return "stopped";
  if (status.includes("inactive") || status.includes("in active")) return "inactive";
  if (Number.isFinite(speed) && speed > 0) return "running";
  return "nodata";
};

const MapZoomBridge = ({ onZoomChange }) => {
  useMapEvents({
    zoomend: (event) => {
      onZoomChange?.(event.target.getZoom());
    },
  });
  return null;
};

const VehicleClusterLayer = ({
  vehicles,
  onVehicleClick,
  onClusterHover,
  onClusterLeave,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!vehicles?.length) return undefined;

    const revealCluster = (layer) => {
      if (!layer) return;
      onClusterLeave?.();
      if (typeof layer.zoomToBounds === "function") {
        layer.zoomToBounds({ padding: [48, 48], maxZoom: 18 });
        return;
      }
      const bounds = layer.getBounds?.();
      if (bounds?.isValid?.()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18, animate: true });
        return;
      }
      const center = layer.getLatLng?.();
      if (center) {
        map.setView(center, Math.max(map.getZoom(), CLUSTER_SWITCH_ZOOM + 2), { animate: true });
      }
    };

    const bindClusterIconClick = (layer) => {
      const iconEl = layer?._icon;
      if (!iconEl || iconEl.__vtpClusterClickBound) return;
      iconEl.__vtpClusterClickBound = "1";
      iconEl.style.cursor = "pointer";
      iconEl.style.pointerEvents = "auto";
      L.DomEvent.on(iconEl, "click", (ev) => {
        L.DomEvent.stop(ev);
        revealCluster(layer);
      });
    };

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 56,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => createClusterIcon(cluster.getChildCount()),
      zoomToBoundsOnClick: false,
    });

    clusterGroup.on("clusterclick", (event) => {
      revealCluster(event?.layer);
    });

    // Fallback path for cases where clusterclick is flaky on some cluster sizes.
    clusterGroup.on("click", (event) => {
      const isCluster = Boolean(event?.layer?.getAllChildMarkers);
      if (!isCluster) return;
      revealCluster(event.layer);
    });

    clusterGroup.on("clustermouseover", (event) => {
      bindClusterIconClick(event?.layer);
      const latLng = event.layer.getLatLng?.();
      if (!latLng) return;
      const point = map.latLngToContainerPoint(latLng);
      const clusterVehicles =
        event.layer
          .getAllChildMarkers?.()
          ?.map((marker) => marker?.options?.vehicleData)
          ?.filter(Boolean) || [];
      onClusterHover?.({
        x: point.x,
        y: point.y,
        vehicles: clusterVehicles,
      });
    });

    clusterGroup.on("clustermouseout", () => {
      onClusterLeave?.();
    });

    vehicles.forEach((vehicle) => {
      const lat = Number(vehicle.latitude);
      const lng = Number(vehicle.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: getIconForVehicle(vehicle),
        vehicleData: vehicle,
      });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        onVehicleClick?.(vehicle);
      });
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    return () => {
      map.removeLayer(clusterGroup);
      clusterGroup.clearLayers();
    };
  }, [map, vehicles, onVehicleClick, onClusterHover, onClusterLeave]);

  return null;
};

const MapScaleControl = () => {
  const map = useMap();

  useEffect(() => {
    const scaleControl = L.control.scale({
      position: "bottomright",
      metric: true,
      imperial: false,
      maxWidth: 120,
    });
    map.addControl(scaleControl);
    return () => {
      map.removeControl(scaleControl);
    };
  }, [map]);

  return null;
};

// --- Optimized Animated marker (rotation updates only when segment changes) ---
const AnimatedMarker = ({ vehicle, position, rotation, onVehicleClick, markerRef, showLabels }) => {
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
      {showLabels && (
        <Tooltip direction="top" offset={[0, -14]} permanent>
          {vehicle.vehicle_no || vehicle.imei_id}
        </Tooltip>
      )}
      <Popup>
        <b>{vehicle.vehicle_no || vehicle.imei_id}</b>
        <br />
        Speed: {vehicle.speed ?? "N/A"} km/h
      </Popup>
    </Marker>
  );
};

// --- Optimized VehicleAnimator: NO OSRM, NO per-frame React state ---
const VehicleAnimator = ({ vehicle, onVehicleClick, showLabels }) => {
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

  const rawPath = useMemo(
    () => uniqueGpsPath.map((p) => [p.latitude, p.longitude]),
    [uniqueGpsPath]
  );

  const [routePath, setRoutePath] = useState(rawPath);

  useEffect(() => {
    let cancelled = false;
    setRoutePath(rawPath);

    if (rawPath.length >= 2) {
      fetchSnapppedRoute(rawPath)
        .then((snapped) => {
          if (!cancelled && Array.isArray(snapped) && snapped.length >= 2) {
            setRoutePath(snapped);
          }
        })
        .catch(() => {
          // fall back to raw path silently
        });
    }

    return () => {
      cancelled = true;
    };
  }, [rawPath]);

  const trackPositions = useMemo(() => {
    // Keep track line visible (design preserved)
    return routePath;
  }, [routePath]);

  const pathKey = useMemo(() => {
    if (!routePath.length) return "";
    return routePath.map((p) => `${p[0]},${p[1]}`).join("|");
  }, [routePath]);

  const markerRef = useRef(null);
  const rafRef = useRef(null);
  const lastPathKeyRef = useRef("");

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
    // Don't restart animation if the path hasn't changed.
    if (pathKey && lastPathKeyRef.current === pathKey && rafRef.current) {
      return;
    }

    lastPathKeyRef.current = pathKey;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    idxRef.current = 0;
    segmentStartRef.current = null;

    const path = routePath;
    if (!path || path.length < 2) return;

    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      totalDistance += haversineMeters(path[i], path[i + 1]);
    }

    const speedKmh = Number(vehicle.speed ?? 0);
    const speedMs = speedKmh > 0 ? speedKmh / 3.6 : 0;
    const baseDuration =
      speedMs > 1 ? (totalDistance / speedMs) * 1000 : 45000;
    const totalAnimationDuration = Math.min(
      120000,
      Math.max(20000, baseDuration)
    );
    const segmentDuration = totalAnimationDuration / (path.length - 1);

    const tick = (ts) => {
      if (!segmentStartRef.current) segmentStartRef.current = ts;

      const start = path[idxRef.current];
      const end = path[idxRef.current + 1];

      // Update rotation only when we’re on a segment
      rotationRef.current = getBearing(start, end);

      const elapsed = ts - segmentStartRef.current;
      const progress = Math.min(elapsed / segmentDuration, 1);

      const lat = start[0] + (end[0] - start[0]) * progress;
      const lng = start[1] + (end[1] - start[1]) * progress;

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
        } else {
          idxRef.current = 0;
          rafRef.current = requestAnimationFrame(tick);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pathKey, routePath, vehicle.imei_id, vehicle.speed]);

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
          showLabels={showLabels}
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
      {showLabels && (
        <Tooltip direction="top" offset={[0, -14]} permanent>
          {vehicle.vehicle_no || vehicle.imei_id}
        </Tooltip>
      )}
      <Popup>
        <b>{vehicle.vehicle_no || vehicle.imei_id}</b> (Static)
      </Popup>
    </Marker>
  );
};

// --- Main Map Component ---
const MapComponent = ({
  whenReady,
  mapType = "default",
  showVehiclesLayer = true,
  showTrafficLayer = false,
  showLabelsLayer = true,
  vehicleData,
  onVehicleClick,
  activeGroups,
  geofences,
  onGeofenceCreated,
  showBuiltInControls = true,
  userLocation = null,
  forceClusterPreviewKey = 0,
}) => {
  const mapShellRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(12);
  const [clusterHoverState, setClusterHoverState] = useState(null);
  const [clusterObjectList, setClusterObjectList] = useState(null);
  const [clusterObjectFilter, setClusterObjectFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const mapRef = useRef(null);
  const mapKeyRef = useRef(`map-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const clusterHideTimeoutRef = useRef(null);
  const lastAutoFitKeyRef = useRef("");

  const vehiclesToShow = useMemo(() => {
    if (!vehicleData) return [];

    if (Array.isArray(vehicleData)) {
      return vehicleData.filter((v) => {
        if (!v || !v.imei_id) return false;
        const lat = Number(v.latitude);
        const lng = Number(v.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      });
    }

    if (typeof vehicleData !== "object") return [];

    const allGroups = Object.keys(vehicleData);
    const groupsToFilter =
      activeGroups && activeGroups.length > 0 ? activeGroups : allGroups;

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

  const resolvedMapType = MAP_TYPE_ALIASES[mapType] || mapType || "osm";
  const resolvedTileConfig = TILE_CONFIG[resolvedMapType] || TILE_CONFIG.osm;

  const handleMapReady = useCallback(
    (event) => {
      const map = event?.target ?? null;
      if (!map) return;
      mapRef.current = map;
      setMapInstance(map);
      if (map?.zoomControl) {
        map.removeControl(map.zoomControl);
      }
      setCurrentZoom(map.getZoom?.() ?? 12);
      if (whenReady) {
        whenReady(map);
      }
    },
    [whenReady]
  );

  useEffect(() => {
    setClusterHoverState(null);
    setClusterObjectList(null);
    setSelectedVehicle(null);
  }, [forceClusterPreviewKey]);

  useEffect(() => {
    if (!mapInstance || vehiclesToShow.length === 0) return;

    const autoFitKey = `${forceClusterPreviewKey}-${vehiclesToShow.length}`;
    if (lastAutoFitKeyRef.current === autoFitKey) return;

    const bounds = L.latLngBounds(
      vehiclesToShow
        .map((vehicle) => [Number(vehicle.latitude), Number(vehicle.longitude)])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
    );
    if (!bounds.isValid()) return;

    lastAutoFitKeyRef.current = autoFitKey;
    mapInstance.fitBounds(bounds, {
      padding: [48, 48],
      maxZoom: CLUSTER_SWITCH_ZOOM,
      animate: false,
    });
  }, [mapInstance, vehiclesToShow, forceClusterPreviewKey]);

  useEffect(() => {
    if (clusterHideTimeoutRef.current) {
      clearTimeout(clusterHideTimeoutRef.current);
    }
    return () => {
      if (clusterHideTimeoutRef.current) {
        clearTimeout(clusterHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance) return undefined;
    const hideHover = () => setClusterHoverState(null);
    mapInstance.on("click", hideHover);
    mapInstance.on("zoomstart", hideHover);
    mapInstance.on("movestart", hideHover);
    return () => {
      mapInstance.off("click", hideHover);
      mapInstance.off("zoomstart", hideHover);
      mapInstance.off("movestart", hideHover);
    };
  }, [mapInstance]);

  useEffect(() => {
    if (!mapInstance) return undefined;

    const handlePointerMove = (event) => {
      if (!clusterHoverState) return;
      const target = event?.originalEvent?.target;
      if (!target || typeof target.closest !== "function") return;
      const isOnCluster = Boolean(target.closest(".vtp-cluster-shell"));
      const isOnMenuButton = Boolean(target.closest(".vtp-cluster-menu-btn"));
      if (!isOnCluster && !isOnMenuButton) {
        setClusterHoverState(null);
      }
    };

    const handleZoomStart = () => setClusterHoverState(null);
    const handleMoveStart = () => setClusterHoverState(null);

    mapInstance.on("mousemove", handlePointerMove);
    mapInstance.on("zoomstart", handleZoomStart);
    mapInstance.on("movestart", handleMoveStart);

    return () => {
      mapInstance.off("mousemove", handlePointerMove);
      mapInstance.off("zoomstart", handleZoomStart);
      mapInstance.off("movestart", handleMoveStart);
    };
  }, [mapInstance, clusterHoverState]);

  const clusterStatusSummary = useMemo(() => {
    const summary = { running: 0, stopped: 0, idle: 0, inactive: 0, nodata: 0 };
    (clusterObjectList?.vehicles || []).forEach((vehicle) => {
      const key = getVehicleStatusKey(vehicle);
      if (summary[key] !== undefined) summary[key] += 1;
    });
    return summary;
  }, [clusterObjectList]);

  const handleClusterHover = useCallback((payload) => {
    if (clusterHideTimeoutRef.current) clearTimeout(clusterHideTimeoutRef.current);
    setClusterHoverState(payload);
  }, []);

  const handleClusterLeave = useCallback(() => {
    if (clusterHideTimeoutRef.current) clearTimeout(clusterHideTimeoutRef.current);
    clusterHideTimeoutRef.current = setTimeout(() => {
      setClusterHoverState(null);
    }, 240);
  }, []);

  const handleVehicleSelect = useCallback(
    (vehicle) => {
      if (!vehicle) return;
      setSelectedVehicle(vehicle);
      onVehicleClick?.(vehicle);
    },
    [onVehicleClick]
  );

  const filteredClusterVehicles = useMemo(() => {
    const vehicles = clusterObjectList?.vehicles || [];
    if (clusterObjectFilter === "all") return vehicles;
    return vehicles.filter((vehicle) => getVehicleStatusKey(vehicle) === clusterObjectFilter);
  }, [clusterObjectList, clusterObjectFilter]);

  const clusterObjectPanelStyle = useMemo(() => {
    if (!clusterObjectList?.anchor) return null;

    const shellRect = mapShellRef.current?.getBoundingClientRect?.();
    const panelWidth = 280;
    const margin = 12;
    const baseX = Number(clusterObjectList.anchor.x) || 0;
    const baseY = Number(clusterObjectList.anchor.y) || 0;

    let left = baseX + 34;
    let top = baseY - 24;
    let maxHeight = 420;

    if (shellRect) {
      maxHeight = Math.max(280, Math.min(420, shellRect.height - margin * 2));

      if (left + panelWidth + margin > shellRect.width) {
        left = baseX - panelWidth - 20;
      }
      if (left < margin) left = margin;

      if (top + maxHeight + margin > shellRect.height) {
        top = shellRect.height - maxHeight - margin;
      }
      if (top < margin) top = margin;
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      right: "auto",
      maxHeight: `${maxHeight}px`,
    };
  }, [clusterObjectList]);

  return (
    <div ref={mapShellRef} style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        key={mapKeyRef.current}
        center={[24.8607, 67.0011]}
        zoom={12}
        maxZoom={MAX_MAP_ZOOM}
        zoomControl={false}
        scrollWheelZoom={true}
        whenReady={handleMapReady}
        style={{ height: "100%", width: "100%" }}
      >
        <MapZoomBridge onZoomChange={setCurrentZoom} />
        <MapScaleControl />
        <TileLayer
          key={`base-${resolvedMapType}`}
          attribution={resolvedTileConfig.attribution}
          url={resolvedTileConfig.url}
          maxZoom={resolvedTileConfig.maxZoom || MAX_MAP_ZOOM}
        />
        {showTrafficLayer && (
          <TileLayer
            key="traffic-overlay"
            attribution={TRAFFIC_TILE_CONFIG.attribution}
            url={TRAFFIC_TILE_CONFIG.url}
            opacity={0.5}
          />
        )}
        {resolvedMapType === "google_satellite" && showLabelsLayer && (
          <>
            <TileLayer
              key="satellite-place-labels"
              attribution={SATELLITE_LABELS_CONFIG.attribution}
              url={SATELLITE_LABELS_CONFIG.url}
              opacity={0.9}
            />
            <TileLayer
              key="satellite-detail-labels"
              attribution={SATELLITE_DETAIL_LABELS_CONFIG.attribution}
              url={SATELLITE_DETAIL_LABELS_CONFIG.url}
              subdomains={SATELLITE_DETAIL_LABELS_CONFIG.subdomains}
              opacity={0.95}
            />
          </>
        )}

        {showVehiclesLayer && currentZoom <= CLUSTER_SWITCH_ZOOM && (
          <VehicleClusterLayer
            vehicles={vehiclesToShow}
            onVehicleClick={handleVehicleSelect}
            onClusterHover={handleClusterHover}
            onClusterLeave={handleClusterLeave}
          />
        )}

        {showVehiclesLayer &&
          currentZoom > CLUSTER_SWITCH_ZOOM &&
          vehiclesToShow.map((vehicle) => (
            <VehicleAnimator
              key={vehicle.imei_id}
              vehicle={vehicle}
              onVehicleClick={handleVehicleSelect}
              showLabels={showLabelsLayer}
            />
          ))}

        {selectedVehicle &&
          Number.isFinite(Number(selectedVehicle.latitude)) &&
          Number.isFinite(Number(selectedVehicle.longitude)) && (
            <>
              <Circle
                center={[Number(selectedVehicle.latitude), Number(selectedVehicle.longitude)]}
                radius={120}
                pathOptions={{
                  color: "#2a7fff",
                  fillColor: "#2a7fff",
                  fillOpacity: 0.08,
                  weight: 2.5,
                }}
              />
              <Circle
                center={[Number(selectedVehicle.latitude), Number(selectedVehicle.longitude)]}
                radius={45}
                pathOptions={{
                  color: "#4da3ff",
                  fillColor: "#4da3ff",
                  fillOpacity: 0.12,
                  weight: 1.5,
                }}
              />
            </>
          )}

        {userLocation &&
          Number.isFinite(Number(userLocation.lat)) &&
          Number.isFinite(Number(userLocation.lng)) && (
            <>
              <Marker
                position={[Number(userLocation.lat), Number(userLocation.lng)]}
                icon={userLocationIcon}
              >
                <Popup>
                  <b>You are here</b>
                </Popup>
              </Marker>
              {Number.isFinite(Number(userLocation.accuracy)) && userLocation.accuracy > 0 && (
                <Circle
                  center={[Number(userLocation.lat), Number(userLocation.lng)]}
                  radius={Number(userLocation.accuracy)}
                  pathOptions={{
                    color: "#2a7fff",
                    fillColor: "#2a7fff",
                    fillOpacity: 0.14,
                    weight: 1.5,
                  }}
                />
              )}
            </>
          )}

        <GeofenceDisplayLayer geofences={geofences} />
        <GeofenceDrawControl onGeofenceCreated={onGeofenceCreated} />
      </MapContainer>

      {/* RIGHT SIDE BLACK CONTROLS (always when mapInstance exists) */}
      {mapInstance && showBuiltInControls && (
        <MapControls
          onControlClick={() => {}}
          onZoomIn={() => mapInstance.zoomIn()}
          onZoomOut={() => mapInstance.zoomOut()}
        />
      )}

      {clusterHoverState && clusterHoverState.vehicles?.length > 0 && (
        <button
          type="button"
          className="vtp-cluster-menu-btn"
          style={{
            left: `${clusterHoverState.x + 24}px`,
            top: `${clusterHoverState.y - 14}px`,
          }}
          onMouseEnter={() => {
            if (clusterHideTimeoutRef.current) clearTimeout(clusterHideTimeoutRef.current);
          }}
          onMouseLeave={() => {
            if (clusterHideTimeoutRef.current) clearTimeout(clusterHideTimeoutRef.current);
            clusterHideTimeoutRef.current = setTimeout(() => setClusterHoverState(null), 160);
          }}
          onClick={() => {
            setClusterObjectList({
              vehicles: clusterHoverState.vehicles,
              anchor: { x: clusterHoverState.x, y: clusterHoverState.y },
            });
            setClusterObjectFilter("all");
            setClusterHoverState(null);
          }}
          title="Open object list"
          aria-label="Open object list"
        >
          &#8801;
        </button>
      )}

      {clusterObjectList && (
        <aside className="vtp-object-list-panel" style={clusterObjectPanelStyle || undefined}>
          <div className="vtp-object-list-head">
            <strong>Object List</strong>
            <button
              type="button"
              onClick={() => {
                setClusterObjectList(null);
                setClusterObjectFilter("all");
              }}
              aria-label="Close object list"
            >
              &times;
            </button>
          </div>
          <div className="vtp-object-list-summary">
            <button
              type="button"
              className={`vtp-sum-running ${clusterObjectFilter === "running" ? "is-active" : ""}`}
              onClick={() => setClusterObjectFilter((prev) => (prev === "running" ? "all" : "running"))}
            >
              {clusterStatusSummary.running}
            </button>
            <button
              type="button"
              className={`vtp-sum-stopped ${clusterObjectFilter === "stopped" ? "is-active" : ""}`}
              onClick={() => setClusterObjectFilter((prev) => (prev === "stopped" ? "all" : "stopped"))}
            >
              {clusterStatusSummary.stopped}
            </button>
            <button
              type="button"
              className={`vtp-sum-idle ${clusterObjectFilter === "idle" ? "is-active" : ""}`}
              onClick={() => setClusterObjectFilter((prev) => (prev === "idle" ? "all" : "idle"))}
            >
              {clusterStatusSummary.idle}
            </button>
            <button
              type="button"
              className={`vtp-sum-inactive ${clusterObjectFilter === "inactive" ? "is-active" : ""}`}
              onClick={() => setClusterObjectFilter((prev) => (prev === "inactive" ? "all" : "inactive"))}
            >
              {clusterStatusSummary.inactive}
            </button>
            <button
              type="button"
              className={`vtp-sum-total ${clusterObjectFilter === "all" ? "is-active" : ""}`}
              onClick={() => setClusterObjectFilter("all")}
            >
              {clusterObjectList.vehicles.length}
            </button>
          </div>
          <div className="vtp-object-list-table">
            <div className="vtp-object-list-row vtp-head-row">Object</div>
            {filteredClusterVehicles.map((vehicle) => {
              const statusKey = getVehicleStatusKey(vehicle);
              return (
                <button
                  key={vehicle.imei_id || vehicle.vehicle_no}
                  type="button"
                  className="vtp-object-list-row vtp-object-item"
                  onClick={() => {
                    const lat = Number(vehicle.latitude);
                    const lng = Number(vehicle.longitude);
                    if (mapInstance && Number.isFinite(lat) && Number.isFinite(lng)) {
                      mapInstance.flyTo([lat, lng], Math.max(mapInstance.getZoom(), 16));
                    }
                    handleVehicleSelect(vehicle);
                    setClusterObjectList(null);
                    setClusterObjectFilter("all");
                  }}
                >
                  <span className={`vtp-dot-${statusKey}`} />
                  <span>{vehicle.vehicle_no || vehicle.imei_id || "Vehicle"}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
};

export default MapComponent;
