export const transformVehicleDataForInfoPanel = (apiData) => {
  if (!apiData || typeof apiData !== 'object') return null;

  const getVehicleImage = (type) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('truck') || typeLower.includes('mixer') || typeLower.includes('handler') || typeLower.includes('dumper') || typeLower.includes('trailer') || typeLower.includes('ecomet')) return '/icons/truck.png';
    if (typeLower.includes('car') || typeLower.includes('suv') || typeLower.includes('muv') || typeLower.includes('hatchback') || typeLower.includes('mercedes')) return '/icons/car.png'; 
    if (typeLower.includes('bike') || typeLower.includes('motorcycle')) return '/icons/bike.png';
    if (typeLower.includes('ambulance')) return '/icons/ambulance.png';
    if (typeLower.includes('van') || typeLower.includes('tempo') || typeLower.includes('campervan')) return '/icons/van.png';
    if (typeLower.includes('bus')) return '/icons/bus.png';
    if (typeLower.includes('rickshaw')) return '/icons/rickshaw.png';
    if (typeLower.includes('hot air ballon') || typeLower.includes('hotairballon')) return '/icons/hotairballoon.png';
    if (typeLower.includes('default')) return '/icons/default-vehicle.png';
    return '/icons/placeholder-suv.png';
  };

  let driverName = apiData.driver_first_name && apiData.driver_first_name !== "--" 
    ? `${apiData.driver_first_name} ${apiData.driver_last_name !== "--" ? apiData.driver_last_name : ''}`.trim()
    : "N/A";

  return {
    vehicleType: apiData.vehicle_type || "N/A",
    vehicleImage: getVehicleImage(apiData.vehicle_type),
    plate: apiData.vehicle_no || apiData.vehicle_reg_no || "N/A",
    status: apiData.status || "N/A",
    tripDistance: apiData.trip_distance !== undefined ? parseFloat(apiData.trip_distance).toFixed(2) : "N/A",
    odometer: apiData.odometer !== undefined ? String(apiData.odometer).padStart(7, '0') : "N/A",
    driver: driverName,
    mobile: apiData.driver_mobile || "N/A",
    location: (apiData.latitude && apiData.longitude) ? `${parseFloat(apiData.latitude).toFixed(6)}, ${parseFloat(apiData.longitude).toFixed(6)}` : "N/A",
    address: apiData.location || "N/A", 
    geofence: apiData.geofence_name || "N/A",
    runningTime: apiData.running_time || "N/A",
    stopTime: apiData.stop_time || "N/A",
    idleTime: apiData.idle_time || "N/A",
    inactiveTime: apiData.inactive_time || "N/A",
    workHour: apiData.work_hour || "N/A",
    currentSpeed: apiData.speed !== undefined ? String(apiData.speed) : "N/A",
    averageSpeed: apiData.average_speed !== undefined ? String(apiData.average_speed) : "N/A",
    maxSpeed: apiData.max_speed !== undefined ? String(apiData.max_speed) : "N/A",
    speedLimit: apiData.speed_limit !== undefined ? String(apiData.speed_limit) : "N/A",
    imeino: apiData.imeino,
    device_model: apiData.device_model,
    external_volt: apiData.external_volt,
    direction: apiData.direction,
    angle: apiData.angle,
    gps_time: apiData.gps_time,
    servertime: apiData.servertime,
  };
};
