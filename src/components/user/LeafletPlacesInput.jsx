import { useRef, useEffect, useState } from 'react'

const LeafletPlacesInput = ({ value = '', onChange, placeholder, onPlaceSelect, disabled = false }) => {
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Nominatim API for geocoding (OpenStreetMap)
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'RideMitra/1.0'
          }
        }
      )
      const data = await response.json()
      
      const formattedSuggestions = data.map(item => ({
        address: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      }))
      
      setSuggestions(formattedSuggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error searching location:', error)
      setSuggestions([])
    }
  }

  const handleInputChange = (e) => {
    if (disabled) return
    const newValue = e.target.value
    onChange(newValue)
    searchLocation(newValue)
    setSelectedIndex(-1)
  }

  const handleSelectSuggestion = (suggestion) => {
    onChange(suggestion.address)
    setShowSuggestions(false)
    setSuggestions([])
    if (onPlaceSelect) {
      onPlaceSelect({
        address: suggestion.address,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude
      })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelectSuggestion(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => !disabled && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        required
        disabled={disabled}
        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-button shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`px-4 py-2 cursor-pointer hover:bg-secondary transition ${
                index === selectedIndex ? 'bg-accent/20' : ''
              }`}
            >
              <div className="text-sm text-text-primary">{suggestion.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LeafletPlacesInput

