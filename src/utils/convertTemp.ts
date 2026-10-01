import type { TemperatureUnit } from "../types/weather"

/**
 * 
 * @param temp Temperature to convert
 * @param unit Unit to convert to ('metric' -> converts to Celsius, 'imperial' -> converts to Fahrenheit)
 * @returns converted temperature
 */ 
export function convertTemp(temp: number, targetUnit: TemperatureUnit): number {
    switch(targetUnit) {
        case "imperial":
            return ((temp * 1.8) + 32) // Celsius to Fahrenheit
        case "metric":
            return ((temp - 32) / 1.8) // Fahrenheit to Celsius
    }
}