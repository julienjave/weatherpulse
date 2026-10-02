import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  const mockHandleInputChange = vi.fn()

  const sampleOptions = [
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU', state: 'New South Wales' },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCitySearch).mockReturnValue({
      searchTerm: '',
      handleInputChange: mockHandleInputChange,
      options: [],
      isSearching: false,
      searchError: null,
    })
  })

  // --- CITY MODE TESTS ---

  describe('City Mode', () => {
    it('renders input field, search mode toggle, and geolocation button', () => {
      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      expect(screen.getByRole('combobox', { name: /search city/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /use my location/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /city search/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /coordinates search/i })).toBeInTheDocument()
    })

    it('calls handleInputChange when user types into the input field', async () => {
      const user = userEvent.setup()

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      const input = screen.getByRole('combobox', { name: /search city/i })
      await user.type(input, 'Syd')

      expect(mockHandleInputChange).toHaveBeenCalled()
    })

    it('renders options dropdown when options are supplied by useCitySearch hook', async () => {
      const user = userEvent.setup()
      vi.mocked(useCitySearch).mockReturnValue({
        searchTerm: 'Syd',
        handleInputChange: mockHandleInputChange,
        options: sampleOptions,
        isSearching: false,
        searchError: null,
      })

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      const input = screen.getByRole('combobox', { name: /search city/i })
      await user.click(input)

      expect(await screen.findByText('Sydney')).toBeInTheDocument()
      expect(screen.getByText(/New South Wales, Australia/i)).toBeInTheDocument()
    })

    it('triggers onSelectLocation when an option is selected from dropdown', async () => {
      const user = userEvent.setup()
      vi.mocked(useCitySearch).mockReturnValue({
        searchTerm: 'Paris',
        handleInputChange: mockHandleInputChange,
        options: sampleOptions,
        isSearching: false,
        searchError: null,
      })

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      const input = screen.getByRole('combobox', { name: /search city/i })
      await user.click(input)

      const parisOption = await screen.findByText('Paris')
      await user.click(parisOption)

      expect(mockOnSelectLocation).toHaveBeenCalledWith(sampleOptions[1])
    })

    it('disables geolocation button and displays progress spinner when isGeoloading is true', () => {
      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
          isGeoloading={true}
        />
      )

      const myLocationButton = screen.getByRole('button', { name: /use my location/i })
      expect(myLocationButton).toBeDisabled()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('triggers onUseMyLocation when geolocation icon button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      const myLocationBtn = screen.getByRole('button', { name: /use my location/i })
      await user.click(myLocationBtn)

      expect(mockOnUseMyLocation).toHaveBeenCalledTimes(1)
    })

    it('renders searchError alert when custom search hook returns error', () => {
      vi.mocked(useCitySearch).mockReturnValue({
        searchTerm: 'BadQuery',
        handleInputChange: mockHandleInputChange,
        options: [],
        isSearching: false,
        searchError: 'Failed to fetch city recommendations.',
      })

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      expect(screen.getByText('Failed to fetch city recommendations.')).toBeInTheDocument()
    })

    it('renders geoError warning alert when passed via props', () => {
      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
          geoError="User denied Geolocation permission"
        />
      )

      expect(screen.getByText('User denied Geolocation permission')).toBeInTheDocument()
    })
  })

  // --- COORDINATES MODE TESTS ---

  describe('Coordinates Mode', () => {
    it('switches UI to coordinate form when coordinate tab is clicked', async () => {
      const user = userEvent.setup()

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      const coordsToggle = screen.getByRole('button', { name: /coordinates search/i })
      await user.click(coordsToggle)

      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^go$/i })).toBeInTheDocument()
    })

    it('validates invalid latitude and displays error alert', async () => {
      const user = userEvent.setup()

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      await user.click(screen.getByRole('button', { name: /coordinates search/i }))

      const latInput = screen.getByLabelText(/latitude/i)
      const lonInput = screen.getByLabelText(/longitude/i)

      await user.type(latInput, '100') // invalid: > 90
      await user.type(lonInput, '45')

      const submitButton = screen.getByRole('button', { name: /^go$/i })
      await user.click(submitButton)

      expect(await screen.findByText('Latitude must be between -90 and 90')).toBeInTheDocument()
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
    })

    it('validates invalid longitude and displays error alert', async () => {
      const user = userEvent.setup()

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      await user.click(screen.getByRole('button', { name: /coordinates search/i }))

      const latInput = screen.getByLabelText(/latitude/i)
      const lonInput = screen.getByLabelText(/longitude/i)

      await user.type(latInput, '45')
      await user.type(lonInput, '200') // invalid: > 180

      const submitButton = screen.getByRole('button', { name: /^go$/i })
      await user.click(submitButton)

      expect(await screen.findByText('Longitude must be between -180 and 180')).toBeInTheDocument()
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
    })

    it('submits valid coordinates and triggers onSelectLocation with reverse geocoded data', async () => {
      const user = userEvent.setup()
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: [sampleOptions[0]],
        error: null,
      })

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      await user.click(screen.getByRole('button', { name: /coordinates search/i }))

      await user.type(screen.getByLabelText(/latitude/i), '-33.86')
      await user.type(screen.getByLabelText(/longitude/i), '151.20')
      await user.click(screen.getByRole('button', { name: /^go$/i }))

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

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      await user.click(screen.getByRole('button', { name: /coordinates search/i }))

      await user.type(screen.getByLabelText(/latitude/i), '12.34')
      await user.type(screen.getByLabelText(/longitude/i), '56.78')
      await user.click(screen.getByRole('button', { name: /^go$/i }))

      await waitFor(() => {
        expect(mockOnSelectLocation).toHaveBeenCalledWith({
          name: '12.34°, 56.78°',
          lat: 12.34,
          lon: 56.78,
          country: '',
        })
      })
    })

    it('displays error alert if reverse geocoding request fails', async () => {
      const user = userEvent.setup()
      vi.mocked(weatherApi.getReverseGeocode).mockRejectedValueOnce(new Error('Network Error'))

      render(
        <SearchBar
          onSelectLocation={mockOnSelectLocation}
          onUseMyLocation={mockOnUseMyLocation}
        />
      )

      await user.click(screen.getByRole('button', { name: /coordinates search/i }))

      await user.type(screen.getByLabelText(/latitude/i), '10')
      await user.type(screen.getByLabelText(/longitude/i), '10')
      await user.click(screen.getByRole('button', { name: /^go$/i }))

      expect(await screen.findByText('Failed to resolve coordinates. Please try again.')).toBeInTheDocument()
    })
  })
})