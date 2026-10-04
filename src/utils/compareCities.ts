import type { GeocodingLocation } from "../types/weather"

export function isSameLocation(a: GeocodingLocation, b: GeocodingLocation): boolean {
  return a.lat.toFixed(2) === b.lat.toFixed(2) && a.lon.toFixed(2) === b.lon.toFixed(2)
}
