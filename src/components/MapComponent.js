// src/components/MapComponent.js
"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Import MarkerCluster CSS & JS
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

// --- Leaflet Default Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// --- Define Custom Icons ---
const createVehicleIcon = (
  iconUrl,
  size = [38, 38],
  anchor = [size[0] / 2, size[1]]
) => {
  if (!iconUrl) {
    return new L.Icon.Default();
  }
  try {
    return L.icon({
      iconUrl,
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: [0, -anchor[1] + (size[1] - anchor[1]) - 5],
    });
  } catch {
    return new L.Icon.Default();
  }
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
  if (type.includes("hot air ballon") || type.includes("hotairballon"))
    return iconRegistry.hotairballoon;
  if (type.includes("rickshaw")) return iconRegistry.rickshaw;
  if (
    type.includes("truck") ||
    type.includes("mixer") ||
    type.includes("handler") ||
    type.includes("dumper") ||
    type.includes("trailer") ||
    type.includes("ecomet")
  )
    return iconRegistry.truck;
  if (type.includes("bus")) return iconRegistry.bus;
  if (
    type.includes("van") ||
    type.includes("tempo") ||
    type.includes("campervan")
  )
    return iconRegistry.van;
  if (type.includes("bike") || type.includes("motorcycle"))
    return iconRegistry.bike;
  if (
    type.includes("car") ||
    type.includes("suv") ||
    type.includes("muv") ||
    type.includes("hatchback") ||
    type === "mercedes"
  )
    return iconRegistry.car;
  if (type.includes("default")) return iconRegistry.default;
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

    vehiclesToShow.forEach((vehicle) => {
      if (
        vehicle &&
        typeof vehicle.latitude === "number" &&
        typeof vehicle.longitude === "number" &&
        vehicle.id
      ) {
        const marker = L.marker([vehicle.latitude, vehicle.longitude], {
          icon: getIconForVehicle(vehicle),
        });
        marker.bindPopup(
          `<b>${vehicle.vehicle_no || vehicle.id}</b><br>Status: ${
            vehicle.status || "N/A"
          }<br>Speed: ${
            vehicle.speed !== undefined ? vehicle.speed + " km/h" : "N/A"
          }`
        );
        marker.on("click", (e) => {
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

const MapComponent = ({
  whenReady,
  showVehiclesLayer,
  vehicleData,
  onVehicleClick,
}) => {
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allVehiclesList =
    vehicleData && typeof vehicleData === "object"
      ? Object.values(vehicleData)
          .flat()
          .filter(
            (v) =>
              v &&
              v.id &&
              typeof v.latitude === "number" &&
              typeof v.longitude === "number"
          )
      : [];

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
    <div
      style={{
        height: "100vh",
        width: "calc(100vw - 140px)",
        marginLeft: "-260px",
      }}
    >
      <MapContainer
        center={[24.8607, 67.0011]}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInstanceAccess
          onMapReady={(map) => {
            setMapInstance(map);
            if (whenReady) whenReady(map);
          }}
        />
        {showVehiclesLayer && mapInstance && (
          <VehicleMarkersLayer
            vehiclesToShow={allVehiclesList}
            onVehicleClick={onVehicleClick}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;



// src/components/MapComponent.js
// "use client";

// import React, { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // --- (No changes to Icon Fix or Icon Registry) ---
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });

// const createVehicleIcon = (iconUrl) => {
//   if (!iconUrl) return new L.Icon.Default();
//   return L.icon({
//     iconUrl,
//     iconSize: [32, 32],
//     iconAnchor: [16, 16],
//     popupAnchor: [0, -16],
//   });
// };

// const iconRegistry = {
//   car: createVehicleIcon("/icons/car.png", [32, 32]),
//   bike: createVehicleIcon("/icons/bike.png", [28, 28]),
//   truck: createVehicleIcon("/icons/truck.png", [40, 40]),
//   van: createVehicleIcon("/icons/van.png", [35, 35]),
//   bus: createVehicleIcon("/icons/bus.png", [38, 38]),
//   ambulance: createVehicleIcon("/icons/ambulance.png", [35, 35]),
//   rickshaw: createVehicleIcon("/icons/rickshaw.png", [30, 30]),
//   hotairballoon: createVehicleIcon("/icons/hotairballoon.png", [45, 45]),
//   default: createVehicleIcon("/icons/default-vehicle.png", [30, 30]),
//   placeholder: createVehicleIcon("/icons/placeholder-suv.png", [32, 32]),
//   safeDefault: new L.Icon.Default(),
// };

// const getIconForVehicle = (vehicle) => {
//   console.log(vehicle)
//   if (!vehicle || !vehicle.vehicle_type) return iconRegistry.default;
//   const type = String(vehicle.vehicle_type).toLowerCase();

//   if (type.includes("ambulance")) return iconRegistry.ambulance;
//   if (type.includes("hot air ballon") || type.includes("hotairballon"))
//     return iconRegistry.hotairballoon;
//   if (type.includes("rickshaw")) return iconRegistry.rickshaw;
//   if (
//     type.includes("truck") ||
//     type.includes("mixer") ||
//     type.includes("handler") ||
//     type.includes("dumper") ||
//     type.includes("trailer") ||
//     type.includes("ecomet")
//   )
//     return iconRegistry.truck;
//   if (type.includes("bus")) return iconRegistry.bus;
//   if (
//     type.includes("van") ||
//     type.includes("tempo") ||
//     type.includes("campervan")
//   )
//     return iconRegistry.van;
//   if (type.includes("bike") || type.includes("motorcycle"))
//     return iconRegistry.bike;
//   if (
//     type.includes("car") ||
//     type.includes("suv") ||
//     type.includes("muv") ||
//     type.includes("hatchback") ||
//     type === "mercedes"
//   )
//     return iconRegistry.car;
//   if (type.includes("default")) return iconRegistry.default;
//   return iconRegistry.placeholder;
// };

// // --- UPDATED: Self-Contained Animator with Data Validation ---
// const SimpleVehicleAnimator = ({ vehicle, onVehicleClick }) => {
//   const rawPath = (vehicle.path || []).map(p => [p.latitude, p.longitude]);

//   // --- NEW: Filter out duplicate consecutive points ---
//   const uniquePath = rawPath.filter((point, i) => {
//       if (i === 0) return true;
//       const prev = rawPath[i-1];
//       return point[0] !== prev[0] || point[1] !== prev[1];
//   });
  
//   const [routeIndex, setRouteIndex] = useState(0);
//   const currentPosition = uniquePath[routeIndex] || [vehicle.latitude, vehicle.longitude];

//   useEffect(() => {
//     setRouteIndex(0);

//     // --- NEW: Check if there's a valid path to animate ---
//     if (uniquePath.length < 2) {
//       // If there's no real path, do nothing.
//       return;
//     }

//     const totalAnimationTime = 50000;
//     const intervalDuration = totalAnimationTime / (uniquePath.length - 1);

//     const intervalId = setInterval(() => {
//       setRouteIndex((prevIndex) => {
//         if (prevIndex >= uniquePath.length - 1) {
//           clearInterval(intervalId);
//           return prevIndex;
//         }
//         return prevIndex + 1;
//       });
//     }, intervalDuration);

//     return () => clearInterval(intervalId);

//   }, [vehicle.path]); // Use original path as dependency to re-trigger on new data

//   // --- NEW: Conditional Rendering Logic ---
//   if (uniquePath.length < 2) {
//     // If no animation is possible, render a single static marker.
//     return (
//       <Marker
//         position={[vehicle.latitude, vehicle.longitude]}
//         icon={getIconForVehicle(vehicle)}
//         eventHandlers={{ click: () => onVehicleClick && onVehicleClick(vehicle) }}
//       >
//         <Popup>
//           <b>{vehicle.vehicle_no || vehicle.id}</b> (Parked)<br />
//           Status: {vehicle.status || "N/A"}
//         </Popup>
//       </Marker>
//     );
//   }

//   // If animation is possible, render the moving marker and its trail.
//   return (
//     <>
//       <Polyline positions={uniquePath} color="blue" weight={3} opacity={0.7} />
//       <Marker
//         position={currentPosition}
//         icon={getIconForVehicle(vehicle)}
//         eventHandlers={{ click: () => onVehicleClick && onVehicleClick(vehicle) }}
//       >
//         <Popup>
//           <b>{vehicle.vehicle_no || vehicle.id}</b><br />
//           Status: {vehicle.status || "N/A"}<br />
//           Speed: {vehicle.speed !== undefined ? vehicle.speed + " km/h" : "N/A"}
//         </Popup>
//       </Marker>
//     </>
//   );
// };

// // --- (No changes to MapInstanceAccess or the main MapComponent) ---
// const MapInstanceAccess = ({ onMapReady }) => {
//   const map = useMap();
//   useEffect(() => {
//     if (map && onMapReady) onMapReady(map);
//   }, [map, onMapReady]);
//   return null;
// };

// const MapComponent = ({
//   whenReady,
//   showVehiclesLayer,
//   vehicleData,
//   onVehicleClick,
// }) => {
//   const allVehiclesList =
//     vehicleData && typeof vehicleData === "object"
//       ? Object.values(vehicleData)
//           .flat()
//           .filter(
//             (v) => v && v.id && typeof v.latitude === "number" && typeof v.longitude === "number"
//           )
//       : [];

//   return (
//     <MapContainer
//       center={[24.8607, 67.0011]}
//       zoom={12}
//       scrollWheelZoom={true}
//       style={{ height: "100%", width: "100%" }}
//     >
//       <TileLayer
//         attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />
//       <MapInstanceAccess onMapReady={whenReady} />
      
//       {showVehiclesLayer && allVehiclesList.map((vehicle) => (
//         <SimpleVehicleAnimator
//           key={vehicle.id}
//           vehicle={vehicle}
//           onVehicleClick={onVehicleClick}
//         />
//       ))}
//     </MapContainer>
//   );
// };

// export default MapComponent;