type Format = 'full' | 'day-long' | 'day-short' | 'time'

/**
 * Formats the date and time to the searched location local time
 * 
 * @param timezoneOffsetSeconds - Shift in seconds from UTC
 * @param format - Formatting option
 * @param dt - Optional: timestamp parameter
 * @returns Formatted date (e.g., "Thursday Oct 03, 4:12 PM" (full), "Thu 03" (day))
 */
export function formatLocalTime(
    timezoneOffsetSeconds: number, 
    format: Format = 'full',
    dt?: number
): string {
    // Get current UTC time in milliseconds
    const now = new Date()
    const utcTimestamp = dt 
        ? dt * 1000 +  now.getTimezoneOffset() * 60000
        : now.getTime() + now.getTimezoneOffset() * 60000

    // Add the city's UTC offset (in milliseconds)
    const targetTimestamp = utcTimestamp + timezoneOffsetSeconds * 1000
    const targetDate = new Date(targetTimestamp)

    // Format using native Intl API
    if(format === 'day-short') {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            day: '2-digit'
        }).format(targetDate)
    } else if(format === 'day-long') {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            day: '2-digit',
            month: 'short'
        }).format(targetDate)
    } else if(format === 'time') {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(targetDate)
    } else {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(targetDate)
    }
}