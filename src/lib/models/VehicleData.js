import mongoose from 'mongoose';

// --- Core Vehicle Schema: Fast, essential real-time data only ---
const VehicleSchema = new mongoose.Schema({
  imei_id: { type: Number, required: true, unique: true, index: true },
  user_id: { type: String, required: true, index: true },

  vehicle_no: { type: String },
  vehicle_type: String,
  company: String,

  server_date: { type: Date, required: true, index: true },
  device_date: { type: Date, required: true },

  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  altitude: Number,
  speed: Number,
  odo_meter: Number,
  angle_name: String,

  user_status: String,
  movement_status: String,
  sleep_mode: String,
  sleep_mode_desc: String,
  ignition_state: String,
  valid: mongoose.Schema.Types.Mixed,

  battery_power: String,
  battery_level: Number,
  battery_voltage: Number,
  external_voltage: Number,
  satellites: Number,
  gnss_state: String,
  gnss_status: String,
  gsm_signal_level: Number,

  // Ref to External metadata (optional & loaded only when needed)
  external_data_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleExternalData' },
});

// Optimized for fast lean queries (suggested in your routes):
// Vehicle.find(...).lean()

export const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

// --- External Data (Heavy/Slow-Changing Fields Separated) ---
const VehicleExternalDataSchema = new mongoose.Schema({
  imei_id: { type: Number, required: true, index: true },

  // Reverse Geocoded Info
  location_name: String,
  road: String,
  district_name: String,
  city_name: String,
  state_name: String,
  country_name: String,
  poi: String,

  // Weather & Fuel Info
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

  updated_at: { type: Date, default: Date.now },
});

export const VehicleExternalData = mongoose.models.VehicleExternalData || mongoose.model('VehicleExternalData', VehicleExternalDataSchema);

// --- Vehicle Path Point (Lightweight, Append-Only, Optional TTL) ---
const VehiclePathPointSchema = new mongoose.Schema({
  imei_id: { type: Number, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: Number,
  timestamp: { type: Date, required: true, index: true },
});

// Optional: keep only last 90 days
// VehiclePathPointSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const VehiclePathPoint = mongoose.models.VehiclePathPoint || mongoose.model('VehiclePathPoint', VehiclePathPointSchema);
