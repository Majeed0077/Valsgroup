// // src/app/api/vehicles-with-paths/route.js
// src/app/api/vehicles-with-paths/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Helper: make a small curved-ish path around a start point
function makePath(lat, lng, steps = 6, dLat = 0.001, dLng = 0.0015) {
  const now = Date.now();
  const pts = [];
  for (let i = 0; i < steps; i++) {
    // small variation to look like movement
    const lat2 = lat + dLat * i;
    const lng2 = lng + dLng * i;
    pts.push({
      latitude: Number(lat2.toFixed(6)),
      longitude: Number(lng2.toFixed(6)),
      timestamp: now - (steps - 1 - i) * 8000,
    });
  }
  return pts;
}

export async function GET() {
  // Karachi-ish coordinates
  const dummyVehicles = [
    {
      imei_id: 10001,
      vehicle_no: "DUMMY-001",
      vehicle_type: "Car",
      latitude: 24.8607,
      longitude: 67.0011,
      speed: 34,
      angle_name: 0,
      path: makePath(24.8588, 66.9992, 7, 0.00035, 0.00045),
    },
    {
      imei_id: 10002,
      vehicle_no: "DUMMY-002",
      vehicle_type: "Truck",
      latitude: 24.872,
      longitude: 67.035,
      speed: 0, // Parked
      angle_name: 0,
      path: [
        { latitude: 24.872, longitude: 67.035, timestamp: Date.now() - 20000 },
        { latitude: 24.872, longitude: 67.035, timestamp: Date.now() - 10000 },
      ],
    },
    {
      imei_id: 10003,
      vehicle_no: "DUMMY-003",
      vehicle_type: "Bike",
      latitude: 24.845,
      longitude: 67.02,
      speed: 18,
      angle_name: 0,
      path: makePath(24.844, 67.018, 7, 0.00025, 0.00055),
    },
    {
      imei_id: 10004,
      vehicle_no: "DUMMY-004",
      vehicle_type: "Van",
      latitude: 24.904,
      longitude: 67.08,
      speed: 12,
      angle_name: 0,
      path: makePath(24.903, 67.078, 6, -0.00025, 0.00035),
    },
    {
      imei_id: 10005,
      vehicle_no: "DUMMY-005",
      vehicle_type: "Ambulance",
      latitude: 24.87,
      longitude: 67.01,
      speed: 0,
      angle_name: 0,
      path: [
        { latitude: 24.87, longitude: 67.01, timestamp: Date.now() - 20000 },
        { latitude: 24.87, longitude: 67.01, timestamp: Date.now() - 10000 },
      ],
    },
  ];

  return NextResponse.json(dummyVehicles, { status: 200 });
}










// import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/mongodb';         // Ensure this path points to your DB connection utility
// import { Vehicle } from '@/lib/models/VehicleData'; // Ensure this path is correct and 'Vehicle' is the exported model name

// /**
//  * API Route: GET /api/vehicles-with-paths
//  * 
//  * Fetches all vehicles and enriches each one with a 'path' property.
//  * The 'path' contains an array of the 5 most recent location points,
//  * sorted chronologically (oldest to newest) for animation purposes.
//  * 
//  * This is achieved using an efficient MongoDB Aggregation Pipeline.
//  * 
//  * CRITICAL FOR PERFORMANCE:
//  * Ensure an index exists on the 'vehiclepathpoints' collection that matches the query.
//  * In mongosh, run: db.vehiclepathpoints.createIndex({ "imei_id": 1, "timestamp": -1 })
//  */
// export async function GET() {
//   try {
//     // 1. Establish a connection to the database. This is a mandatory first step.
//     await dbConnect();

//     // 2. Define the aggregation pipeline.
//     const pipeline = [
//       // Stage 1: For each vehicle, look up its corresponding path points.
//       {
//         $lookup: {
//           from: 'vehiclepathpoints', // The collection to join with.
          
//           // --- CORRECTION HERE ---
//           // Use 'imei_id' (Number) which matches your current Vehicle schema.
//           let: { vehicle_imei_id: '$imei_id' }, 
          
//           // The sub-pipeline to run on the 'vehiclepathpoints' collection for each vehicle.
//           pipeline: [
//             // --- CORRECTION HERE ---
//             // Match points where the path point's 'imei_id' equals the vehicle's 'imei_id'.
//             { $match: { $expr: { $eq: ['$imei_id', '$$vehicle_imei_id'] } } },
            
//             // Sort the matched points by timestamp, newest first.
//             { $sort: { timestamp: -1 } },
            
//             // Limit the results to the 5 most recent points.
//             { $limit: 5 },
            
//             // Reshape the path documents to include only necessary fields.
//             { $project: { _id: 0, latitude: 1, longitude: 1, timestamp: 1 } }
//           ],
//           as: 'path' // The name of the new array field to add to the vehicle document.
//         }
//       },
//       // Stage 2: The path is currently newest-to-oldest. Reverse it for chronological animation.
//       {
//           $addFields: {
//               path: { $reverseArray: "$path" }
//           }
//       }
//     ];

//     // 3. Execute the aggregation pipeline on the Vehicle collection.
//     const vehiclesWithPaths = await Vehicle.aggregate(pipeline);

//     // 4. Return the successful response.
//     return NextResponse.json(vehiclesWithPaths);

//   } catch (error) {
//     // Log the detailed error on the server for debugging.
//     console.error("[API_ERROR] /api/vehicles-with-paths:", error);

//     // Return a structured, user-friendly error to the client.
//     return NextResponse.json(
//       { message: 'An error occurred on the server while fetching vehicle data.', details: error.message },
//       { status: 500 }
//     );
//   }
// }