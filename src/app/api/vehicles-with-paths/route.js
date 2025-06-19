import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb'; // Make sure this path is correct
import { Vehicle } from '@/lib/models/VehicleData';

/**
 * This API route uses a MongoDB Aggregation Pipeline to fetch each vehicle's
 * current details along with an array of its last 5 known locations.
 */
export async function GET() {
  try {
    // --- THIS IS THE FIX ---
    // We MUST wait for the database connection to be established before running any queries.
    await dbConnect();

    // The aggregation pipeline runs only AFTER the connection is successful.
    const pipeline = [
      {
        $lookup: {
          from: 'vehiclepathpoints',
          let: { vehicle_imei: '$imeino' },
          pipeline: [
            { $match: { $expr: { $eq: ['$imeino', '$$vehicle_imei'] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, latitude: 1, longitude: 1, timestamp: 1 } }
          ],
          as: 'path'
        }
      },
      {
          $addFields: {
              path: { $reverseArray: "$path" }
          }
      }
    ];

    const vehiclesWithPaths = await Vehicle.aggregate(pipeline);

    return NextResponse.json(vehiclesWithPaths);

  } catch (error) {
    console.error("[API /api/vehicles-with-paths] Error fetching data:", error);
    return NextResponse.json(
      // Pass the specific error message to the frontend for better debugging
      { error: 'Failed to fetch vehicle data with paths.', details: error.message },
      { status: 500 }
    );
  }
}