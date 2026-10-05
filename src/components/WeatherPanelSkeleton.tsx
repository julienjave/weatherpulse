import { Box, Skeleton, Stack } from "@mui/material"


// === COMPONENT: WEATHERPANELSKELETON =====================================================

// Mirrors WeatherPanel's layout so the page doesn't jump when the real data arrives
export function WeatherPanelSkeleton() {
    return (
        <Box
            role="status"
            aria-busy="true"
            aria-label="Loading weather data"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 1,
                borderRadius: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)'
            }}
        >
            {/* HEADER BAR: favorite button + units switch */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="rounded" width={90} height={60} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: 1 }}>
                {/* CURRENT WEATHER CARD (60%) */}
                <Skeleton variant="rounded" sx={{ flex: '3 1 0', minWidth: 0, height: 'auto', borderRadius: '12px' }} />

                {/* METRICS + TEMPERATURE TRENDS (40%) */}
                <Stack sx={{ flex: '2 1 0', minWidth: 0, gap: 1 }}>
                    <Skeleton variant="rounded" height={130} sx={{ borderRadius: '12px' }} />
                    <Skeleton variant="rounded" height={300} sx={{ borderRadius: '12px' }} />
                </Stack>
            </Box>

            {/* FORECAST */}
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: '12px' }} />
        </Box>
    )
}
