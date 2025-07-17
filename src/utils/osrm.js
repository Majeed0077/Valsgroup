// src/utils/osrm.js

/**
 * Fetches a route from the public OSRM server and handles errors gracefully.
 * @param {Array<[number, number]>} coordinates - An array of [latitude, longitude] points. Must have at least two points.
 * @returns {Promise<Array<[number, number]>>} A promise that resolves to an array of [lat, lng] points for the route.
 */
export async function fetchSnapppedRoute(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("At least two coordinates are required to fetch a route.");
  }

  // OSRM expects {longitude},{latitude};{longitude},{latitude}
  const coordsString = coordinates.map(p => `${p[1]},${p[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);

    // --- THIS IS THE FIX ---
    // First, check if the request was rate-limited or had another error.
    if (!response.ok) {
      if (response.status === 429) {
        console.error("OSRM Rate Limit Exceeded. Please wait before making more requests.");
        // Throw a user-friendly error
        throw new Error("Too Many Requests to the routing service. Please try again in a moment.");
      }
      // For any other server error...
      const errorText = await response.text(); // Get the HTML/text error body
      console.error(`Error fetching from OSRM: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Routing service failed with status: ${response.status}`);
    }
    // --- END OF FIX ---

    // If we get here, response.ok is true, so it's safe to parse as JSON.
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // OSRM returns coordinates as [longitude, latitude]. We need to convert them to [latitude, longitude].
      const routeCoordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      return routeCoordinates;
    } else {
      console.warn("OSRM did not return a valid route:", data);
      throw new Error("No route found between the provided points.");
    }
  } catch (error) {
    // This catches network errors (e.g., no internet) or the errors we threw above.
    console.error("fetchSnapppedRoute failed:", error.message);
    // Re-throw the error so the calling component can display it to the user.
    throw error;
  }
}