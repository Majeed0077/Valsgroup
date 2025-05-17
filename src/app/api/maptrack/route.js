// src/app/api/maptrack/route.js
import { NextResponse } from 'next/server';

// The actual external API endpoint
const EXTERNAL_API_BASE_URL = 'http://203.215.168.43:4051'; // Your external API IP and Port
const API_AUTH_TOKEN = 'Bearer vtslivemapview_sec987'; // Your static auth token

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imeino = searchParams.get('imeino');
  const fdate = searchParams.get('fdate');
  const tdate = searchParams.get('tdate');

  if (!imeino || !fdate || !tdate) {
    return NextResponse.json({ error: 'Missing required query parameters: imeino, fdate, tdate' }, { status: 400 });
  }

  // Construct the full URL for the external API
  // Note: Using a single slash for '/maptrack'. If the external API strictly requires '//maptrack',
  // you would change '/maptrack' to '//maptrack' below.
  const externalApiUrl = `http://203.215.168.43:4051/maptrack?imeino=${encodeURIComponent(imeino)}&fdate=${encodeURIComponent(fdate)}&tdate=${encodeURIComponent(tdate)}`;

  console.log(`[API Route /api/maptrack] Forwarding request to: ${externalApiUrl}`);

  try {
    const apiResponse = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': API_AUTH_TOKEN,
        // Add any other headers the external API might require
        // 'Content-Type': 'application/json', // Usually not needed for GET
      },
      // If you were using Next.js < 13.5 with Pages Router API routes and `node-fetch`,
      // you might want `cache: 'no-store'` or similar.
      // For App Router Route Handlers, fetch is extended:
      cache: 'no-store', // Ensures fresh data for dynamic requests
    });

    // Get the response body as text first to handle non-JSON error responses better
    const responseBodyText = await apiResponse.text();

    if (!apiResponse.ok) {
      console.error(`[API Route /api/maptrack] External API Error: ${apiResponse.status} ${apiResponse.statusText}`, responseBodyText);
      // Try to parse as JSON if it's an error, otherwise send text
      let errorJson = { error: `External API responded with status ${apiResponse.status}`, details: responseBodyText };
      try {
        errorJson = JSON.parse(responseBodyText);
        // If parsing succeeds but there's no 'error' field, wrap it
        if (!errorJson.error && !errorJson.message) {
            errorJson = { error: `External API responded with status ${apiResponse.status}`, details: errorJson };
        } else if (errorJson.message && !errorJson.error) {
            errorJson.error = errorJson.message; // Standardize to 'error' field
        }

      } catch (e) {
        // Parsing failed, use the text directly in details
      }
      return NextResponse.json(errorJson, { status: apiResponse.status });
    }

    // If response is OK, try to parse as JSON
    try {
      const data = JSON.parse(responseBodyText);
      console.log("[API Route /api/maptrack] Successfully fetched and parsed data from external API.");
      return NextResponse.json(data);
    } catch (e) {
      console.error("[API Route /api/maptrack] Error parsing JSON response from external API:", e, "Response Text:", responseBodyText);
      return NextResponse.json({ error: 'Failed to parse JSON response from external API', details: responseBodyText }, { status: 500 });
    }

  } catch (error) {
    console.error('[API Route /api/maptrack] Network or other error during fetch to external API:', error);
    return NextResponse.json({ error: 'Failed to connect to the external API or other internal error.', details: error.message }, { status: 502 }); // 502 Bad Gateway is often appropriate
  }
}