import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ComponentProps } from 'react'
import { FavoritesBar } from '../FavoritesBar'
import type { GeocodingLocation } from '../../types/weather'

const PARIS: GeocodingLocation = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }
const SYDNEY: GeocodingLocation = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' }

describe('FavoritesBar Component', () => {
  const mockOnSelect = vi.fn()
  const mockOnDelete = vi.fn()

  // Renders FavoritesBar with all required props, allowing overrides per test
  const renderFavoritesBar = (props: Partial<ComponentProps<typeof FavoritesBar>> = {}) =>
    render(
      <FavoritesBar
        favorites={[PARIS, SYDNEY]}
        selectedCity={null}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
        {...props}
      />
    )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the bar visible with a placeholder when there are no favorites', () => {
    renderFavoritesBar({ favorites: [] })

    const favoritesBar = screen.getByRole('navigation', { name: 'Favorite cities' })
    expect(favoritesBar).toHaveTextContent('No favorites yet')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('hides the placeholder once there are favorites', () => {
    renderFavoritesBar()

    expect(screen.queryByText('No favorites yet')).not.toBeInTheDocument()
  })

  it('renders one chip per favorite city with its country code', () => {
    renderFavoritesBar()

    expect(screen.getByRole('button', { name: 'Paris, FR' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sydney, AU' })).toBeInTheDocument()
  })

  it('calls onSelect with the city when a chip is clicked', async () => {
    const user = userEvent.setup()
    renderFavoritesBar()

    await user.click(screen.getByRole('button', { name: 'Sydney, AU' }))

    expect(mockOnSelect).toHaveBeenCalledWith(SYDNEY)
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('calls onDelete (and not onSelect) when the delete icon is clicked', async () => {
    const user = userEvent.setup()
    renderFavoritesBar()

    const parisChip = screen.getByRole('button', { name: 'Paris, FR' })
    await user.click(parisChip.querySelector('.MuiChip-deleteIcon')!)

    expect(mockOnDelete).toHaveBeenCalledWith(PARIS)
    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it('calls onDelete when Backspace is pressed on a focused chip', async () => {
    const user = userEvent.setup()
    renderFavoritesBar()

    screen.getByRole('button', { name: 'Paris, FR' }).focus()
    await user.keyboard('{Backspace}')

    expect(mockOnDelete).toHaveBeenCalledWith(PARIS)
  })

  it('marks the chip of the currently displayed city as current', () => {
    renderFavoritesBar({ selectedCity: { ...SYDNEY, lat: -33.8691 } })

    expect(screen.getByRole('button', { name: 'Sydney, AU' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Paris, FR' })).not.toHaveAttribute('aria-current')
  })
})
