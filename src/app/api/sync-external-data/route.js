import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Vehicle, VehiclePathPoint } from '@/lib/models/VehicleData'; // Correctly import both models

// Environment variables should be defined in .env.local
const EXTERNAL_API_URL = process.env.EXTERNAL_MAPVIEW_API_URL;
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_MAPVIEW_API_TOKEN;
const EXTERNAL_API_USERID = process.env.EXTERNAL_MAPVIEW_API_USERID;

/**
 * API Route: Fetches vehicle data from an external source and syncs it to MongoDB.
 * Intended to be run periodically by a cron job.
 */
export async function GET(request) {
  // --- 1. Configuration Check ---
  if (!EXTERNAL_API_URL || !EXTERNAL_API_TOKEN || !EXTERNAL_API_USERID) {
    console.error("[API Sync] Missing environment variables. Ensure EXTERNAL_MAPVIEW_API_URL, EXTERNAL_MAPVIEW_API_TOKEN, and EXTERNAL_MAPVIEW_API_USERID are set.");
    return NextResponse.json({ error: 'Sync server is not configured correctly.' }, { status: 500 });
  }

  try {
    // --- 2. Connect to Database ---
    await dbConnect();

    // --- 3. Fetch Data from External Source ---
    console.log('[API Sync] Fetching data from external source...');
    
    const url = new URL(`${EXTERNAL_API_URL}/vtp/mapview`);
    url.searchParams.append("userid", EXTERNAL_API_USERID);

    const fetchOptions = {
        method: 'GET',
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${EXTERNAL_API_TOKEN}`,
            'Content-Type': 'application/json',
        }
    };

    const externalResponse = await fetch(url.toString(), fetchOptions);

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error(`[API Sync] Error fetching from external source: ${externalResponse.status}`, errorText);
      return NextResponse.json({ error: `External API fetch failed with status ${externalResponse.status}`, details: errorText }, { status: 502 });
    }

    const data = await externalResponse.json();
    const vehiclesToSync = Array.isArray(data) ? data : (data?.vehicles || data?.data || []);

    if (!Array.isArray(vehiclesToSync) || vehiclesToSync.length === 0) {
      console.log('[API Sync] No vehicles found in the external source response.');
      return NextResponse.json({ message: 'No new vehicle data found to sync.' }, { status: 200 });
    }

    // --- 4. Process Each Vehicle ---
    let successCount = 0;
    let errorCount = 0;

    for (const vehicleData of vehiclesToSync) {
      try {
        if (!vehicleData.imei_id || vehicleData.latitude == null || vehicleData.longitude == null) {
          console.warn('[API Sync] Skipping vehicle due to missing essential data (imei_id, lat, lng).', { imei: vehicleData.imei_id });
          errorCount++;
          continue;
        }

        // --- CORRECTION ---
        // Use the device_date for the most accurate path timestamp. Fallback to server_date.
        const recordTimestamp = vehicleData.device_date ? new Date(vehicleData.device_date) : new Date(vehicleData.server_date);

        // --- CORRECTION ---
        // OPERATION 1: UPDATE LATEST STATE (Upsert) using 'imei_id'
        await Vehicle.findOneAndUpdate(
          { imei_id: vehicleData.imei_id }, // Query by the correct, indexed field
          { $set: vehicleData }, // The payload from external API matches our schema
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // --- CORRECTION ---
        // OPERATION 2: STORE HISTORICAL PATH POINT (Create) using 'imei_id'
        await VehiclePathPoint.create({
          imei_id: vehicleData.imei_id, // Use the correct field name
          latitude: parseFloat(vehicleData.latitude),
          longitude: parseFloat(vehicleData.longitude),
          speed: vehicleData.speed != null ? parseFloat(vehicleData.speed) : 0,
          timestamp: recordTimestamp, // Use the more accurate device timestamp
        });

        successCount++;
      } catch (dbError) {
        errorCount++;
        // --- CORRECTION ---
        // Log the error with the correct identifier
        console.error(`[API Sync] DB error processing IMEI_ID ${vehicleData.imei_id}:`, dbError.message);
      }
    }

    // --- 5. Return Final Response ---
    const summaryMessage = `Sync complete. Processed: ${successCount}, Errors: ${errorCount}`;
    console.log(`[API Sync] ${summaryMessage}`);
    return NextResponse.json({ message: summaryMessage, success: successCount, errors: errorCount });

  } catch (error) {
    console.error('[API Sync] Critical error in sync process:', error);
    return NextResponse.json({ error: 'Sync process failed.', details: error.message }, { status: 500 });
  }
}