import { useRef, useEffect } from 'react'

const GooglePlacesInput = ({ value, onChange, placeholder, onPlaceSelect }) => {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places || !inputRef.current) {
      // Wait a bit and try again if Google Maps is still loading
      const timer = setTimeout(() => {
        if (window.google && window.google.maps && window.google.maps.places && inputRef.current) {
          initializeAutocomplete()
        }
      }, 500)
      return () => clearTimeout(timer)
    }

    initializeAutocomplete()

    function initializeAutocomplete() {
      if (!inputRef.current || !window.google?.maps?.places) return

      try {
        // Clean up existing autocomplete if any
        if (autocompleteRef.current && window.google.maps.event) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry', 'name']
        })

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace()
          if (place && place.geometry && place.geometry.location) {
            const address = place.formatted_address || place.name || value
            let lat, lng
            
            if (place.geometry.location) {
              if (typeof place.geometry.location.lat === 'function') {
                lat = place.geometry.location.lat()
                lng = place.geometry.location.lng()
              } else {
                lat = place.geometry.location.lat
                lng = place.geometry.location.lng
              }
            }
            
            if (onPlaceSelect && lat && lng) {
              console.log('Calling onPlaceSelect with:', { address, latitude: lat, longitude: lng })
              onPlaceSelect({
                address,
                latitude: lat,
                longitude: lng
              })
              // Also update the input value
              if (onChange) {
                onChange(address)
              }
            }
          }
        })
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error)
      }
    }

    return () => {
      if (autocompleteRef.current && window.google && window.google.maps && window.google.maps.event) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [onPlaceSelect, value])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent"
    />
  )
}

export default GooglePlacesInput

