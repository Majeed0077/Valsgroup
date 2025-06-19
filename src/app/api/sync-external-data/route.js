import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
// Using the correct model names 'Vehicle' and 'VehiclePathPoint' as exported from your schema file.
import { Vehicle, VehiclePathPoint } from '@/lib/models/VehicleData';

const EXTERNAL_SOURCE_API_URL = process.env.EXTERNAL_MAPVIEW_API_URL;
const EXTERNAL_SOURCE_API_TOKEN = process.env.EXTERNAL_MAPVIEW_API_AUTH_TOKEN;

/**
 * This API route is designed to be called periodically (e.g., by a cron job or a frontend interval).
 * It fetches the latest data from an external source and syncs it with the local MongoDB database.
 */
export async function GET(request) {
  // --- 1. Configuration Check ---
  if (!EXTERNAL_SOURCE_API_URL) {
    console.error("[API Sync] Missing environment variable: EXTERNAL_MAPVIEW_API_URL.");
    return NextResponse.json({ error: 'Sync server is not configured correctly (missing API URL).' }, { status: 500 });
  }

  try {
    // --- 2. Connect to Database ---
    await dbConnect();

    // --- 3. Fetch Data from External Source ---
    console.log('[API Sync] Fetching data from external source...');

    const fetchOptions = {
        method: 'GET',
        cache: 'no-store', // Always get the latest data, do not cache the response.
        headers: {
            'Content-Type': 'application/json',
        }
    };
    // Only add the Authorization header if the token is provided in the environment variables.
    if (EXTERNAL_SOURCE_API_TOKEN) {
        fetchOptions.headers['Authorization'] = EXTERNAL_SOURCE_API_TOKEN;
    }

    const externalResponse = await fetch(`${EXTERNAL_SOURCE_API_URL}?company=ooo`, fetchOptions);

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error(`[API Sync] Error fetching from external source: ${externalResponse.status}`, errorText);
      return NextResponse.json({ error: `External API fetch failed with status ${externalResponse.status}`, details: errorText }, { status: 502 }); // 502 Bad Gateway is appropriate here.
    }

    const data = await externalResponse.json();
    // Safely extract the array of vehicles, even if the top-level response is not an array.
    const vehiclesToSync = Array.isArray(data) ? data : (data?.vehicles || data?.data || []);

    if (!Array.isArray(vehiclesToSync) || vehiclesToSync.length === 0) {
      console.log('[API Sync] No vehicles found in the external source response to sync.');
      return NextResponse.json({ message: 'No new vehicle data found to sync.' }, { status: 200 });
    }

    // --- 4. Process Each Vehicle ---
    let successCount = 0;
    let errorCount = 0;

    for (const vehicleData of vehiclesToSync) {
      try {
        // Basic validation to ensure we have the minimum required data.
        if (!vehicleData.imeino || vehicleData.latitude == null || vehicleData.longitude == null) {
          console.warn('[API Sync] Skipping vehicle due to missing essential data (imeino, latitude, or longitude).', vehicleData.vehicle_no || 'Unknown Vehicle');
          errorCount++;
          continue; // Skip this vehicle and move to the next one.
        }

        const recordTimestamp = vehicleData.servertime ? new Date(vehicleData.servertime) : new Date();

        // OPERATION 1: UPDATE LATEST STATE (Upsert)
        // This finds a vehicle by its unique 'imeino' and updates it.
        // If it doesn't exist, 'upsert: true' creates it. This keeps a single, up-to-date record per vehicle.
        await Vehicle.findOneAndUpdate(
          { imeino: vehicleData.imeino },
          { $set: { ...vehicleData, last_updated: new Date() } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // OPERATION 2: STORE HISTORICAL PATH POINT (Create)
        // This creates a new, small document to build the vehicle's historical trail for features like route playback.
        await VehiclePathPoint.create({
          imeino: vehicleData.imeino,
          latitude: parseFloat(vehicleData.latitude),
          longitude: parseFloat(vehicleData.longitude),
          speed: vehicleData.speed != null ? parseFloat(vehicleData.speed) : null,
          timestamp: recordTimestamp,
        });

        successCount++;
      } catch (dbError) {
        errorCount++;
        console.error(`[API Sync] Database error while processing vehicle IMEI ${vehicleData.imeino || 'Unknown'}:`, dbError.message);
      }
    }

    // --- 5. Return Final Response ---
    const summaryMessage = `Sync complete. Processed: ${successCount}, Errors: ${errorCount}`;
    console.log(`[API Sync] ${summaryMessage}`);
    return NextResponse.json({ message: summaryMessage, success: successCount, errors: errorCount });

  } catch (error) {
    // This catches errors from dbConnect, the initial fetch, or JSON parsing.
    console.error('[API Sync] A critical error occurred in the sync process:', error);
    return NextResponse.json({ error: 'The sync process failed due to a critical error.', details: error.message }, { status: 500 });
  }
}