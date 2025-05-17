// src/app/api/mapview/route.js
import { NextResponse } from 'next/server';

// Retrieve from environment variables
const MAPVIEW_EXTERNAL_API_URL = process.env.EXTERNAL_MAPVIEW_API_URL;
const MAPVIEW_API_AUTH_TOKEN = process.env.EXTERNAL_MAPVIEW_API_AUTH_TOKEN;

export async function GET(request) {
  if (!MAPVIEW_EXTERNAL_API_URL || !MAPVIEW_API_AUTH_TOKEN) {
    console.error("[API Route /api/mapview] Missing environment variables for mapview external API configuration.");
    return NextResponse.json({ error: 'Server configuration error. Unable to connect to the external mapview service.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');

  if (!company) {
    return NextResponse.json({ error: 'Missing required query parameter: company' }, { status: 400 });
  }

  const externalApiUrl = `${MAPVIEW_EXTERNAL_API_URL}?company=${encodeURIComponent(company)}`;

  console.log(`[API Route /api/mapview] Forwarding request to: ${externalApiUrl}`);

  try {
    const apiResponse = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': MAPVIEW_API_AUTH_TOKEN,
        'Content-Type': 'application/json', // May or may not be needed by the external GET API
      },
      cache: 'no-store',
    });

    const responseBodyText = await apiResponse.text();

    if (!apiResponse.ok) {
      console.error(`[API Route /api/mapview] External API Error: ${apiResponse.status} ${apiResponse.statusText}`, "Response Body:", responseBodyText);
      let errorJson = { error: `External API responded with status ${apiResponse.status}`, details: responseBodyText };
      try {
        const parsedError = JSON.parse(responseBodyText);
        if (parsedError && typeof parsedError === 'object') {
            errorJson.error = parsedError.error || parsedError.message || errorJson.error;
            if (parsedError.details) errorJson.details = parsedError.details;
            else if (Object.keys(parsedError).length > 0 && !parsedError.error && !parsedError.message) {
                errorJson.details = parsedError;
            }
        }
      } catch (e) {
        // Parsing failed
      }
      return NextResponse.json(errorJson, { status: apiResponse.status });
    }

    try {
      const data = JSON.parse(responseBodyText);
      console.log("[API Route /api/mapview] Successfully fetched and parsed data from external API.");
      return NextResponse.json(data);
    } catch (e) {
      console.error("[API Route /api/mapview] Error parsing JSON response from external API:", e, "Response Text:", responseBodyText);
      return NextResponse.json({ error: 'Failed to parse JSON response from external API', details: responseBodyText }, { status: 502 });
    }

  } catch (error) {
    console.error('[API Route /api/mapview] Network or other error during fetch to external API:', error);
    return NextResponse.json({ error: 'Failed to connect to the external API or other internal error.', details: error.message }, { status: 503 });
  }
}