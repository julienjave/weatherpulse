import type { TemperatureUnit } from "../types/weather"

/**
 * 
 * @param temp Temperature to convert
 * @param unit Unit to convert to ('metric' -> converts to Celsius, 'imperial' -> converts to Fahrenheit)
 * @returns converted temperature
 */ 
export function convertTemp(temp: number, unit: TemperatureUnit): number {
    switch(unit) {
        case "metric":
            return ((temp * 1.8) + 32)
        case "imperial":
            return ((temp - 32) / 1.8)
    }
}