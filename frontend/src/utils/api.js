/**
 * Standardized API fetch utility for the India Macro Terminal.
 * Handles common networking errors and returns safe defaults.
 */
export async function safeFetch(url, options = {}, defaultValue = null) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.warn(`API Error [${response.status}] at ${url}`);
      return defaultValue;
    }
    return await response.json();
  } catch (error) {
    console.error(`NETWORK ERROR at ${url}:`, error);
    return defaultValue;
  }
}
