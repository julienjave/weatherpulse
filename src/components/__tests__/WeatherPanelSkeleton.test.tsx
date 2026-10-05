import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WeatherPanelSkeleton } from '../WeatherPanelSkeleton'

describe('WeatherPanelSkeleton Component', () => {
  it('announces itself as a busy loading region', () => {
    render(<WeatherPanelSkeleton />)

    const status = screen.getByRole('status', { name: 'Loading weather data' })
    expect(status).toHaveAttribute('aria-busy', 'true')
  })

  it("renders a placeholder for each of the panel's sections", () => {
    render(<WeatherPanelSkeleton />)

    // Favorite button, units switch, current weather, metrics, temperature trends, forecast
    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(6)
  })
})
