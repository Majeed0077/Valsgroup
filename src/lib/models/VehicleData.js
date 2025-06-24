import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  // --- Core Identifiers (Matches your JSON record) ---
  imei_id: { type: Number, required: true, unique: true, index: true },
  user_id: { type: String, required: true, index: true },
  
  // --- Essential Vehicle Metadata (Likely added during registration, not from device) ---
  vehicle_no: { type: String, index: true },
  vehicle_type: String, // e.g., "car", "truck", "bus"
  company: { type: String, index: true },

  // --- Timestamps ---
  server_date: { type: Date, required: true, index: true },
  device_date: { type: Date, required: true },
  
  // --- Location & Movement ---
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  altitude: Number,
  speed: Number, // in km/h
  odo_meter: Number, // Odometer reading
  angle_name: String, // e.g., "North (N)"
  
  // --- Detailed Location Info (Reverse Geocoded) ---
  location_name: String, // Full address string
  road: String,
  district_name: String,
  city_name: String,
  state_name: String,
  country_name: String,
  poi: String, // Point of Interest name

  // --- Device & Vehicle Status ---
  user_status: String, // e.g., "Y" or "N"
  movement_status: String, // e.g., "Moving", "Stopped"
  sleep_mode: String,      // e.g., "0"
  sleep_mode_desc: String, // e.g., "Stop"
  ignition_state: String,  // e.g., "N" or "Y"
  valid: mongoose.Schema.Types.Mixed, // Use Mixed for unknown or variable types like 'null'

  // --- Power & Signal ---
  battery_power: String,   // e.g., "Y"
  battery_level: Number,   // As a percentage, e.g., 0
  battery_voltage: Number,
  external_voltage: Number,
  satellites: Number,      // Number of satellites in view
  gnss_state: String,
  gnss_status: String,
  gsm_signal_level: Number,

  // --- Weather & Fuel (External API Data) ---
  weather: String,
  weather_icon: String,
  temp_c: Number,
  temp_f: Number,
  feelslike_c: Number,
  feelslike_f: Number,
  humidity: Number,
  high_petrol: Number,
  stan_petrol: Number,
  high_diesel: Number,
  stan_diesel: Number,
  kerosene: Number,
  jet_propellant: Number,
  
  // --- Raw/Custom Data ---
  ios_data: String,
});

// This prevents Mongoose from redefining the model every time in development (HMR)
export const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

// You would likely have a separate schema for historical path points for efficiency
const VehiclePathPointSchema = new mongoose.Schema({
    // Use Number to match the main VehicleSchema
    imei_id: { type: Number, required: true, index: true }, 
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: Number,
    // Use 'device_date' as the timestamp from the device itself for accuracy
    timestamp: {type: Date, required: true, index: true} 
});

// Optional: Add a TTL (Time To Live) index to automatically delete old path points
// This example keeps data for 90 days.
// VehiclePathPointSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const VehiclePathPoint = mongoose.models.VehiclePathPoint || mongoose.model('VehiclePathPoint', VehiclePathPointSchema);