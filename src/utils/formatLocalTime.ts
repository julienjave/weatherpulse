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
    // Target time in UTC milliseconds (`dt` is in seconds; 0 is a valid timestamp)
    const utcTimestamp = dt !== undefined ? dt * 1000 : Date.now()

    // Shift by the city's UTC offset, then format in UTC so the machine's own
    // timezone (and its DST changes) never enters the calculation
    const targetDate = new Date(utcTimestamp + timezoneOffsetSeconds * 1000)

    // Format using native Intl API
    if(format === 'day-short') {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            day: '2-digit',
            timeZone: 'UTC'
        }).format(targetDate)
    } else if(format === 'day-long') {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            timeZone: 'UTC'
        }).format(targetDate)
    } else if(format === 'time') {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC'
        }).format(targetDate)
    } else {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC'
        }).format(targetDate)
    }
}