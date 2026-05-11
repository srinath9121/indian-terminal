// Base fetch wrapper to standardize API calls and handle errors
const BASE_URL = "/api"; // Assuming a Vite proxy or relative path for backend

export async function fetchApi(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API] Fetch failed for ${endpoint}:`, error);
    return null; // Return null on failure to prevent crashing the UI
  }
}
