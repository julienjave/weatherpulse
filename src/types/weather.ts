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
    lat: number,
    lon: number,
    country: string,
    state?: string
}


// --- Shared Base Interfaces ----------------------------------------------------------------

export interface WeatherCondition {
  id: number,
  main: string,
  description: string,
  icon: string
}

export interface Coordinates {
  lon: number,
  lat: number
}

export interface Wind {
  speed: number,
  deg: number,
  gust?: number // Optional: Only present in high wind conditions
}

export interface PrecipitationVolume {
  '1h'?: number,
  '3h'?: number
}

// --- Current Weather Response Interface ----------------------------------------------------

export interface CurrentWeatherResponse {
  coord: Coordinates,
  weather: WeatherCondition[],
  base: string,
  main: {
    temp: number,
    feels_like: number,
    temp_min: number,
    temp_max: number,
    pressure: number,
    humidity: number,
    sea_level?: number, // Optional: Omitted for certain inland regions
    grnd_level?: number // Optional: Omitted for certain inland regions
  }
  visibility: number,
  wind: Wind,
  rain?: PrecipitationVolume, // Optional: Omitted when not raining
  snow?: PrecipitationVolume, // Optional: Omitted when not snowing
  clouds: {
    all: number
  },
  dt: number,
  sys: {
    type?: number, // Optional
    id?: number,   // Optional
    country: string,
    sunrise: number,
    sunset: number,
  },
  timezone: number,
  id: number,
  name: string,
  cod: number,
}

// --- Forecast Weather Response Interface ---------------------------------------------------

export interface ForecastItem {
  dt: number,
  main: {
    temp: number,
    feels_like: number,
    temp_min: number,
    temp_max: number,
    pressure: number,
    sea_level?: number, // Optional
    grnd_level?: number, // Optional
    humidity: number,
    temp_kf: number,
  },
  weather: WeatherCondition[],
  clouds: {
    all: number,
  },
  wind: Wind,
  visibility: number,
  pop: number, // Probability of precipitation (0 to 1)
  rain?: {
    '3h': number, // Optional: Only present if precipitation > 0
  },
  snow?: {
    '3h': number // Optional: Only present if snowfall > 0
  },
  sys: {
    pod: string // "d" for day, "n" for night
  },
  dt_txt: string, 
}

export interface ForecastResponse {
  cod: string | number,
  message: number | string,
  cnt: number,
  list: ForecastItem[], // Array of 3-hour forecasts over 5 days (40 total)
  city: {
    id: number,
    name: string,
    coord: Coordinates,
    country: string,
    population: number,
    timezone: number,
    sunrise: number,
    sunset: number
  },
}

// --- Air Quality Response Interface ---------------------------------------------------

export interface AirQualityItem {
  dt: number,
  main: {
    aqi: number // 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
  },
  components: {
    co: number,
    no: number,
    no2: number,
    o3: number,
    so2: number,
    pm2_5: number,
    pm10: number,
    nh3: number
  },
}

export interface AirQualityResponse {
  coord: Coordinates, // Fixed: Object { lon, lat }, not array [lon, lat]
  list: AirQualityItem[] // Array of AQI measurement objects
}