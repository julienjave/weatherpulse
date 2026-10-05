import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TemperatureTrendsCard } from '../TemperatureTrendsCard'
import type { ForecastResponse } from '../../types/weather'

const FORECAST: ForecastResponse = {
  cod: '200',
  message: 0,
  cnt: 2,
  list: [0, 1].map((i) => ({
    dt: 1_790_000_000 + i * 3 * 3600,
    main: { temp: 12, feels_like: 11, temp_min: 12, temp_max: 12, pressure: 1013, humidity: 60, temp_kf: 0 },
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    clouds: { all: 0 },
    wind: { speed: 3, deg: 180 },
    visibility: 10000,
    pop: 0,
    sys: { pod: 'd' },
    dt_txt: '',
  })),
  city: {
    id: 1, name: 'Paris', coord: { lat: 48.85, lon: 2.35 }, country: 'FR',
    population: 0, timezone: 7200, sunrise: 0, sunset: 0,
  },
}

describe('TemperatureTrendsCard Component', () => {
  it('shows a fallback message when there is no forecast data', () => {
    render(<TemperatureTrendsCard forecastData={null} units="metric" />)

    expect(screen.getByRole('heading', { name: 'Next 24 Hours' })).toBeInTheDocument()
    expect(screen.getByText(/No Forecast Data/)).toBeInTheDocument()
  })

  it('renders the chart container instead of the fallback when data is present', () => {
    render(<TemperatureTrendsCard forecastData={FORECAST} units="metric" />)

    expect(screen.queryByText(/No Forecast Data/)).not.toBeInTheDocument()
    expect(document.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })
})
