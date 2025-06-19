// models/VehicleData.js (or your chosen filename like Vehicle.js)
import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({ // Renamed from ProductSchema
  // --- Identifiers ---
  imeino: { type: String, required: true, unique: true, index: true },
  vehicle_no: { type: String, index: true }, // Often used as a display ID
  vehicle_name: String, // User-friendly name for the vehicle
  company: { type: String, index: true }, // To group vehicles by company

  // --- Location & Movement ---
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  altitude: Number, // Typically a number
  speed: Number,    // Typically a number (e.g., km/h)
  angle: Number,    // Course/heading, typically a number (0-359 degrees)
  direction: String, // Cardinal direction (N, NE, E, etc.) or numeric as above
  odometer: Number, // Typically a number (e.g., km)

  // --- Status & Sensors ---
  status: String, // e.g., "Moving", "Parked", "Idle", "Inactive"
  acc_status: String, // Or Number (0/1 for OFF/ON). String if "ON", "OFF"
  // Renamed 'ac' to 'acc_status' for clarity if it means ignition/accessory power
  // If 'ac' means Air Conditioning, then 'ac_status: String' is fine.
  power: String, // Or Boolean if it's just on/off for main device power
  external_volt: String, // Or Number if it's a voltage value
  battery_percentage: Number, // Typically a number (0-100)
  gps_status: String, // Or Boolean (e.g., "FIX", "NO_FIX" or true/false) - renamed 'gps'
  // 'gps' usually implies coordinates, maybe this field means GPS signal status?

  immobilize_state: String, // e.g., "ACTIVE", "INACTIVE"

  // Door statuses (consider if these could be booleans or numbers if 0/1)
  door1: String,
  door2: String,
  door3: String,
  door4: String,

  // Temperature sensors
  temperature: Number,  // Main temperature
  temperature1: Number, // Additional sensor 1
  temperature2: Number, // Additional sensor 2

  // --- Timestamps ---
  servertime: { type: Date, index: true }, // Timestamp from your server when data was processed
  // Consider adding a 'device_timestamp' or 'gps_timestamp' if the device sends its own time
  // gps_time: { type: Date, index: true }, // Example from your previous vehicle object

  // --- Vehicle & Device Info ---
  vehicle_type: String, // e.g., "car", "truck", "bus"
  device_model: String,

  // --- Driver Info (Optional, might be in a separate collection linked by driver_id) ---
  driver_first_name: String,
  driver_last_name: String,
  driver_middle_name: String, // If applicable

  // --- Location Details (Often derived, but can be stored if device sends them) ---
  location: String,     // Full address string
  road: String,
  city: String,
  state: String, // Or Province
  country: String,
  branch: String,       // If applicable to your business
  location_id: String,  // ID of a geofence or predefined location
  poi: String,          // Name of a Point of Interest

  // --- Last Update Timestamp for this record in DB ---
  last_updated: { type: Date, default: Date.now }
});

// Add an index for common query combinations if needed, e.g.,
// VehicleSchema.index({ company: 1, timestamp: -1 });

// This prevents Mongoose from redefining the model every time in development (HMR)
// Use PascalCase for the model name ('Vehicle') and ensure it matches the schema variable.
export const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

// You would likely have a separate schema for historical path points for efficiency
const VehiclePathPointSchema = new mongoose.Schema({
    imeino: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: Number,
    timestamp: {type: Date, required: true, index: true}
});
// VehiclePathPointSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Optional TTL

export const VehiclePathPoint = mongoose.models.VehiclePathPoint || mongoose.model('VehiclePathPoint', VehiclePathPointSchema);

// You might also want to export just one default if this file is only for the Vehicle model
// export default Vehicle;