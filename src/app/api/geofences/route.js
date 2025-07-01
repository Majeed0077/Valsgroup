// src/app/api/geofences/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Geofence } from '@/models/Geofence'; // Adjust path if necessary

// --- GET Request: Fetch all active geofences for a company ---
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company') || 'default_company'; // Get company or use a default

    const geofences = await Geofence.find({ company: company, isActive: true }).lean();
    return NextResponse.json(geofences);

  } catch (error) {
    console.error('[API /geofences GET] Error fetching geofences:', error);
    return NextResponse.json({ error: 'Failed to fetch geofences' }, { status: 500 });
  }
}


// --- POST Request: Create a new geofence ---
export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Basic validation
        if (!body.name || !body.type || !body.data) {
            return NextResponse.json({ error: 'Missing required fields: name, type, data' }, { status: 400 });
        }
        
        let newGeofenceData = {
            name: body.name,
            type: body.type,
            company: body.company || 'default_company',
            description: body.description || '',
            isActive: true,
        };

        if (body.type === 'Polygon') {
            newGeofenceData.polygon = {
                type: 'Polygon',
                coordinates: body.data.coordinates, // Expecting GeoJSON format [lng, lat]
            };
        } else if (body.type === 'Circle') {
            newGeofenceData.circle = {
                center: body.data.center, // Expecting { lat, lng }
                radius: body.data.radius, // Expecting radius in meters
            };
        } else {
            return NextResponse.json({ error: 'Invalid geofence type' }, { status: 400 });
        }
        
        const geofence = await Geofence.create(newGeofenceData);

        return NextResponse.json({ message: 'Geofence created successfully', geofence }, { status: 201 });

    } catch (error) {
        console.error('[API /geofences POST] Error creating geofence:', error);
        return NextResponse.json({ error: 'Failed to create geofence', details: error.message }, { status: 500 });
    }
}