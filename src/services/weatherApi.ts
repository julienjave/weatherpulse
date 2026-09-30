import type { 
    ApiResponse, 
    CurrentWeatherResponse,
    ForecastResponse,
    AirQualityResponse,
    GeocodingLocation,
    TemperatureUnit
} from "../types/weather"

// === CONSTANTS ============================================================================

const API_BASE_URL = `https://api.openweathermap.org/data/2.5`
const GEO_BASE_URL = 'https://api.openweathermap.org/geo/1.0'
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string


// === API HELPER FUNCTION ==================================================================

async function fetchWithEnvelop<T>(
    endpoint: string, 
    params: Record<string, string | number>, 
    timeoutMs: number = 8000
): Promise<ApiResponse<T>> {
    // 1. Build Query String
    const queryParams = new URLSearchParams({
        ...params,
        appid: API_KEY
    })

    const url = `${API_BASE_URL}${endpoint}?${queryParams.toString()}`

    // 2. Set up Timeout Controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    // 3. Fetch request
    try {
        const response = await fetch(url, {signal: controller.signal})
        clearTimeout(timeoutId)

        const payload = await response.json()

        // 4. Handle Non-200 HTTP Responses
        if(!response.ok) {
            const errorMessage = parseApiErrorMessage(response.status, payload?.message)
            return {
                data: null,
                error: {status: response.status, message: errorMessage}
            }
        }

        // 5. Success Return Envelope
        return {
            data: payload as T,
            error: null
        }

    } catch (err: unknown) {
        clearTimeout(timeoutId)

        // 6. Catch Network Failures, Aborts, or JSON Parse Errors
        if(err instanceof Error && err.name === 'AbortError') {
            return {
                data: null,
                error: {
                    status: 408,
                    message: 'Request timed out. Please check your network connection.',
                }
            }
        }

        const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
        return {
            data: null,
            error: {
                status: 500,
                message
            }
        }
    }
}


// --- ERROR MESSAGE PARSING ----------------------------------------------------------------------

function parseApiErrorMessage(status: number, rawMessage: string): string {
    switch(status) {
        case 401:
            return 'Invalid API key. Please check your OpenWeatherMap configuration.'
        case 404:
            return 'City not found. Please verify the spelling and try again.'
        case 429:
            return 'API rate limit exceeded. Please wait a moment before searching again.'
        default:
            return rawMessage ? rawMessage.charAt(0).toUpperCase() + rawMessage.slice(1) : 'Failed to fetch weather data.'
    }
}


// === SEARCH FUNCTION =============================================================================

// Search city by name
export async function searchCityByName(
    cityName: string, 
    limit: number = 5,
    externalSignal?: AbortSignal
): Promise<ApiResponse<GeocodingLocation[]>> {
    if (!cityName.trim()) {
        return { data: [], error: null };
    }

    // 1. Build Query String
    const queryParams = new URLSearchParams({
        q: cityName.trim(),
        limit: String(limit),
        appid: API_KEY
    })

    const url = `${GEO_BASE_URL}/direct?${queryParams.toString()}`

    // 2. Setup Timeout Controller (8s default)
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), 8000)

    // Combine external cancellation signal (if provided by search bar) with timeout signal
    const signal = externalSignal
        ? AbortSignal.any([externalSignal, timeoutController.signal])
        : timeoutController.signal

    // 2. Fetch Request
    try {
        const response = await fetch(url, { signal })
        clearTimeout(timeoutId)

        const payload = await response.json()

        // 3. Handle Non-200 HTTP Responses
        if(!response.ok) {
            return {
                data: null,
                error: {
                    status: response.status, 
                    message: payload?.message || 'Failed to search locations.'
                }
            }
        }

        // 4. Success Return Envelope
        return {
            data: payload as GeocodingLocation[],
            error: null
        }

    } catch (err) {
        clearTimeout(timeoutId)

        if (err instanceof Error && err.name === 'AbortError') {
            // Don't report errors if the request was intentionally aborted by user typing new keys
            if (externalSignal?.aborted) {
                return { data: [], error: null }
            }

            return {
                data: null,
                error: {
                    status: 408,
                    message: 'Search timed out. Please check your network connection.',
                },
            }
        }

        const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
        return {
            data: null,
            error: { status: 500, message },
        }
    }
}


// === FETCH REQUESTS =========================================================================

// Fetch current weather by coordinates (`lat`, `lon`).
export async function fetchCurrentWeatherByCoords(
    lat: number,
    lon: number,
    units: TemperatureUnit = 'metric'
): Promise<ApiResponse<CurrentWeatherResponse>> {
    return fetchWithEnvelop('/weather', { lat, lon, units })
}

// Fetch 5-day / 3-hour forecast data.
export async function fetch5DayForecastByCoords(
    lat: number, 
    lon: number, 
    units: TemperatureUnit = 'metric'
): Promise<ApiResponse<ForecastResponse>> {
    return fetchWithEnvelop('/forecast', { lat, lon, units })
}


// Fetch Air Quality Index (AQI) from OpenWeatherMap Air Pollution API.
export async function fetchAirQualityByCoords(
    lat: number, 
    lon: number
): Promise<ApiResponse<AirQualityResponse>> {
    return fetchWithEnvelop('/air_pollution', { lat, lon })
}
