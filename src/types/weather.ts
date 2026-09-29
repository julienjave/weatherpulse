// --- Standardized API Envelope using a Discriminated Union --------------------------------

export type ApiResponse<T> = { data: T, error: null } | { data: null, error: ApiError }

export interface ApiError {
    status: number,
    message: string
}

export type TemperatureUnit = 'metric' | 'imperial'


// --- GeoCoding ----------------------------------------------------------------------------

export interface GeocodingLocation {
    name: string,
    lat: number;
    lon: number,
    country: string,
    state?: string
}


// --- OpenWeatherMap Current Weather Payload Interface -------------------------------------

export interface CurrentWeatherResponse {
    coord: {
        lon: number,
        lat: number
    },
    weather: Array<{
        id: number,
        main: string,
        description: string,
        icon: string
    }>,
    base: string,
    main: {
        temp: number,
        feels_like: number,
        temp_min: number,
        temp_max: number,
        pressure: number,
        humidity: number,
        sea_level: number,
        grnd_level: number
    },
    visibility: number,
    wind: {
        speed: number,
        deg: number,
        gust: number
    },
    rain: {
        "1h": number
    },
    snow: {
        "1h": number
    },
    clouds: {
        all: number
    },
    dt: number,
    sys: {
        type: number,
        id: number,
        country: string,
        sunrise: number,
        sunset: number
    },
    timezone: number,
    id: number,
    name: string,
    cod: number
}