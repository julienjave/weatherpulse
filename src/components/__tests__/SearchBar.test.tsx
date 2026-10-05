import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ComponentProps } from 'react'
import { SearchBar } from '../SearchBar'
import * as weatherApi from '../../services/weatherApi'
import { useCitySearch } from '../../hooks/useCitySearch'

// Mock custom hook and API service module
vi.mock('../../hooks/useCitySearch')
vi.mock('../../services/weatherApi', () => ({
  getReverseGeocode: vi.fn(),
}))

describe('SearchBar Component', () => {
  const mockOnSelectLocation = vi.fn()
  const mockOnUseMyLocation = vi.fn()
  const mockOnClear = vi.fn()
  const mockHandleInputChange = vi.fn()

  const sampleOptions = [
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU', state: 'New South Wales' },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
  ]

  // Renders SearchBar with all required props, allowing overrides per test
  const renderSearchBar = (props: Partial<ComponentProps<typeof SearchBar>> = {}) =>
    render(
      <SearchBar
        onSelectLocation={mockOnSelectLocation}
        onUseMyLocation={mockOnUseMyLocation}
        onClear={mockOnClear}
        {...props}
      />
    )

  const mockCitySearch = (overrides: Partial<ReturnType<typeof useCitySearch>> = {}) => {
    vi.mocked(useCitySearch).mockReturnValue({
      searchTerm: '',
      handleInputChange: mockHandleInputChange,
      options: [],
      isSearching: false,
      searchError: null,
      ...overrides,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCitySearch()
  })

  // --- CITY MODE TESTS ---

  describe('City Mode', () => {
    it('renders input field, search mode toggle, geolocation button and clear button', () => {
      renderSearchBar()

      expect(screen.getByRole('combobox', { name: /search city/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /use my location/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /city search/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /coordinates search/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument()
    })

    it('calls handleInputChange when user types into the input field', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      const input = screen.getByRole('combobox', { name: /search city/i })
      await user.type(input, 'Syd')

      expect(mockHandleInputChange).toHaveBeenCalled()
    })

    it('renders options dropdown when options are supplied by useCitySearch hook', async () => {
      const user = userEvent.setup()
      mockCitySearch({ searchTerm: 'Syd', options: sampleOptions })
      renderSearchBar()

      const input = screen.getByRole('combobox', { name: /search city/i })
      await user.click(input)

      expect(await screen.findByText('Sydney')).toBeInTheDocument()
      expect(screen.getByText(/New South Wales, Australia/i)).toBeInTheDocument()
    })

    it('triggers onSelectLocation when an option is selected from dropdown', async () => {
      const user = userEvent.setup()
      mockCitySearch({ searchTerm: 'Paris', options: sampleOptions })
      renderSearchBar()

      const input = screen.getByRole('combobox', { name: /search city/i })
      await user.click(input)

      const parisOption = await screen.findByText('Paris')
      await user.click(parisOption)

      expect(mockOnSelectLocation).toHaveBeenCalledWith(sampleOptions[1])
    })

    it('disables geolocation button and displays progress spinner when isGeoloading is true', () => {
      renderSearchBar({ isGeoloading: true })

      const myLocationButton = screen.getByRole('button', { name: /use my location/i })
      expect(myLocationButton).toBeDisabled()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('shows a loading spinner in the input while searching', () => {
      mockCitySearch({ searchTerm: 'Par', isSearching: true })
      renderSearchBar()

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('triggers onUseMyLocation when geolocation icon button is clicked', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      const myLocationBtn = screen.getByRole('button', { name: /use my location/i })
      await user.click(myLocationBtn)

      expect(mockOnUseMyLocation).toHaveBeenCalledTimes(1)
    })

    it('forwards searchError to onError instead of rendering it inline', () => {
      const mockOnError = vi.fn()
      mockCitySearch({ searchTerm: 'BadQuery', searchError: 'Failed to fetch city recommendations.' })
      renderSearchBar({ onError: mockOnError })

      expect(mockOnError).toHaveBeenCalledWith('Failed to fetch city recommendations.')
      expect(screen.queryByText('Failed to fetch city recommendations.')).not.toBeInTheDocument()
    })

    it('shows a "no cities found" message when the search returns no results', async () => {
      const user = userEvent.setup()
      mockCitySearch({ searchTerm: 'Xyzzyq', options: [] })
      renderSearchBar()

      await user.click(screen.getByRole('combobox', { name: /search city/i }))
      await user.keyboard('{ArrowDown}')

      expect(await screen.findByText('No cities found for "Xyzzyq"')).toBeInTheDocument()
    })
  })

  // --- MODE TOGGLE TESTS ---

  describe('Mode Toggle', () => {
    it('stays in city mode when the already-selected toggle is clicked again', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      // MUI emits `null` when deselecting an exclusive toggle; the component ignores it
      await user.click(screen.getByRole('button', { name: /city search/i }))

      expect(screen.getByRole('combobox', { name: /search city/i })).toBeInTheDocument()
      expect(screen.queryByLabelText(/latitude/i)).not.toBeInTheDocument()
    })

    it('clears a coordinate validation error when switching modes', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      await user.click(screen.getByRole('button', { name: /coordinates search/i }))
      await user.type(screen.getByLabelText(/latitude/i), '100')
      await user.type(screen.getByLabelText(/longitude/i), '45')
      await user.click(screen.getByRole('button', { name: /^go$/i }))
      expect(await screen.findByText('Latitude must be between -90 and 90')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /city search/i }))

      await waitFor(() => {
        expect(screen.queryByText('Latitude must be between -90 and 90')).not.toBeInTheDocument()
      })
    })
  })

  // --- COORDINATES MODE TESTS ---

  describe('Coordinates Mode', () => {
    const submitCoords = async (user: ReturnType<typeof userEvent.setup>, lat: string, lon: string) => {
      await user.click(screen.getByRole('button', { name: /coordinates search/i }))
      if (lat) await user.type(screen.getByLabelText(/latitude/i), lat)
      if (lon) await user.type(screen.getByLabelText(/longitude/i), lon)
      await user.click(screen.getByRole('button', { name: /^go$/i }))
    }

    it('switches UI to coordinate form when coordinate tab is clicked', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      const coordsToggle = screen.getByRole('button', { name: /coordinates search/i })
      await user.click(coordsToggle)

      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^go$/i })).toBeInTheDocument()
      expect(screen.queryByRole('combobox', { name: /search city/i })).not.toBeInTheDocument()
    })

    it('validates invalid latitude and displays error alert', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      await submitCoords(user, '100', '45') // invalid: > 90

      expect(await screen.findByText('Latitude must be between -90 and 90')).toBeInTheDocument()
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
    })

    it('validates invalid longitude and displays error alert', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      await submitCoords(user, '45', '200') // invalid: > 180

      expect(await screen.findByText('Longitude must be between -180 and 180')).toBeInTheDocument()
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
    })

    it('shows the latitude error when the form is submitted empty', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      await submitCoords(user, '', '')

      expect(await screen.findByText('Latitude must be between -90 and 90')).toBeInTheDocument()
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
    })

    it('accepts boundary coordinate values (90, -180)', async () => {
      const user = userEvent.setup()
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [], error: null })
      renderSearchBar()

      await submitCoords(user, '90', '-180')

      await waitFor(() => {
        expect(weatherApi.getReverseGeocode).toHaveBeenCalledWith(90, -180)
      })
    })

    it('submits valid coordinates and triggers onSelectLocation with reverse geocoded data', async () => {
      const user = userEvent.setup()
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: [sampleOptions[0]],
        error: null,
      })
      renderSearchBar()

      await submitCoords(user, '-33.86', '151.20')

      await waitFor(() => {
        expect(weatherApi.getReverseGeocode).toHaveBeenCalledWith(-33.86, 151.20)
        expect(mockOnSelectLocation).toHaveBeenCalledWith(sampleOptions[0])
      })
    })

    it('falls back to raw coordinate string if reverse geocoding returns an empty list', async () => {
      const user = userEvent.setup()
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: [],
        error: null,
      })
      renderSearchBar()

      await submitCoords(user, '12.34', '56.78')

      await waitFor(() => {
        expect(mockOnSelectLocation).toHaveBeenCalledWith({
          name: '12.34°, 56.78°',
          lat: 12.34,
          lon: 56.78,
          country: '',
        })
      })
    })

    it('falls back to raw coordinate string if reverse geocoding returns an error envelope', async () => {
      const user = userEvent.setup()
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: null,
        error: { status: 500, message: 'Server error' },
      })
      renderSearchBar()

      await submitCoords(user, '1.005', '2')

      await waitFor(() => {
        expect(mockOnSelectLocation).toHaveBeenCalledWith(
          expect.objectContaining({ lat: 1.005, lon: 2, country: '' })
        )
      })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('disables the Go button and shows a spinner while reverse geocoding', async () => {
      const user = userEvent.setup()
      let resolveRequest!: (value: Awaited<ReturnType<typeof weatherApi.getReverseGeocode>>) => void
      vi.mocked(weatherApi.getReverseGeocode).mockReturnValueOnce(
        new Promise((resolve) => { resolveRequest = resolve })
      )
      const { container } = renderSearchBar()

      await submitCoords(user, '10', '10')

      // While loading, the "Go" label is replaced by a spinner, so query the submit button directly
      const submitButton = container.querySelector('button[type="submit"]')
      expect(submitButton).toBeDisabled()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^go$/i })).not.toBeInTheDocument()

      resolveRequest({ data: [], error: null })

      expect(await screen.findByRole('button', { name: /^go$/i })).toBeEnabled()
    })

    it('displays error alert if reverse geocoding request fails', async () => {
      const user = userEvent.setup()
      vi.mocked(weatherApi.getReverseGeocode).mockRejectedValueOnce(new Error('Network Error'))
      renderSearchBar()

      await submitCoords(user, '10', '10')

      expect(await screen.findByText('Failed to resolve coordinates. Please try again.')).toBeInTheDocument()
    })
  })

  // --- CLEAR BUTTON TESTS ---

  describe('Clear Button', () => {
    it('calls onClear and resets the city search term', async () => {
      const user = userEvent.setup()
      mockCitySearch({ searchTerm: 'Paris' })
      renderSearchBar()

      await user.click(screen.getByRole('button', { name: /^clear$/i }))

      expect(mockOnClear).toHaveBeenCalledTimes(1)
      expect(mockHandleInputChange).toHaveBeenLastCalledWith('')
    })

    it('empties the coordinate inputs and removes the coordinate error', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      await user.click(screen.getByRole('button', { name: /coordinates search/i }))
      await user.type(screen.getByLabelText(/latitude/i), '100')
      await user.type(screen.getByLabelText(/longitude/i), '45')
      await user.click(screen.getByRole('button', { name: /^go$/i }))
      expect(await screen.findByText('Latitude must be between -90 and 90')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /^clear$/i }))

      expect(screen.getByLabelText(/latitude/i)).toHaveValue(null)
      expect(screen.getByLabelText(/longitude/i)).toHaveValue(null)
      await waitFor(() => {
        expect(screen.queryByText('Latitude must be between -90 and 90')).not.toBeInTheDocument()
      })
      expect(mockOnClear).toHaveBeenCalledTimes(1)
    })

    it('keeps the current search mode', async () => {
      const user = userEvent.setup()
      renderSearchBar()

      await user.click(screen.getByRole('button', { name: /coordinates search/i }))
      await user.click(screen.getByRole('button', { name: /^clear$/i }))

      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument()
    })
  })
})
