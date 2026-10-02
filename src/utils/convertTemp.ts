import type { TemperatureUnit } from "../types/weather"

/**
 * Converts temperature values between metric (Celsius) and imperial (Fahrenheit).
 * 
 * @param temp - Temperature value to convert
 * @param fromUnit - Current unit of the temperature value
 * @param toUnit - Target unit to convert into
 * @returns Converted temperature rounded to nearest integer
 */
export function convertTemp(
    temp: number, 
    fromUnit: TemperatureUnit, 
    toUnit: TemperatureUnit
): number {
    if (fromUnit === toUnit) {
        return Math.round(temp)
    }

    if (fromUnit === 'metric' && toUnit === 'imperial') {
        return Math.round((temp * 9) / 5 + 32) // Celsius to Fahrenheit
    }

    return Math.round(((temp - 32) * 5) / 9) // Fahrenheit to Celsius
}