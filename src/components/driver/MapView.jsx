import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const MapView = ({ pickupLocation, dropoffLocation, onClose }) => {
  const mapRef = useRef(null)

  useEffect(() => {
    if (mapRef.current && pickupLocation && dropoffLocation) {
      const map = mapRef.current
      const bounds = [
        [pickupLocation.latitude, pickupLocation.longitude],
        [dropoffLocation.latitude, dropoffLocation.longitude]
      ]
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [pickupLocation, dropoffLocation])

  const openInMaps = (location, label) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
    window.open(url, '_blank')
  }

  if (!pickupLocation || !dropoffLocation) {
    return <div className="text-center py-8 text-text-secondary">Loading map...</div>
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-button p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-text-primary">View on Map</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 mb-4 rounded-button overflow-hidden" style={{ minHeight: '400px' }}>
          <MapContainer
            center={[pickupLocation.latitude, pickupLocation.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[pickupLocation.latitude, pickupLocation.longitude]}>
              <Popup>
                <div>
                  <strong>Pickup Location</strong>
                  <p className="text-sm">{pickupLocation.address}</p>
                  <button
                    onClick={() => openInMaps(pickupLocation, 'Pickup')}
                    className="mt-2 px-3 py-1 bg-accent text-white rounded text-xs hover:bg-accent-hover"
                  >
                    Open in Maps
                  </button>
                </div>
              </Popup>
            </Marker>
            <Marker position={[dropoffLocation.latitude, dropoffLocation.longitude]}>
              <Popup>
                <div>
                  <strong>Dropoff Location</strong>
                  <p className="text-sm">{dropoffLocation.address}</p>
                  <button
                    onClick={() => openInMaps(dropoffLocation, 'Dropoff')}
                    className="mt-2 px-3 py-1 bg-accent text-white rounded text-xs hover:bg-accent-hover"
                  >
                    Open in Maps
                  </button>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 p-3 bg-accent/10 rounded-button">
            <div className="w-4 h-4 bg-accent rounded-full"></div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-text-primary">Pickup</div>
              <div className="text-xs text-text-secondary">{pickupLocation.address}</div>
            </div>
            <button
              onClick={() => openInMaps(pickupLocation, 'Pickup')}
              className="px-4 py-2 bg-accent text-white rounded-button text-sm font-semibold hover:bg-accent-hover"
            >
              Navigate
            </button>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-success/10 rounded-button">
            <div className="w-4 h-4 bg-success rounded-full"></div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-text-primary">Dropoff</div>
              <div className="text-xs text-text-secondary">{dropoffLocation.address}</div>
            </div>
            <button
              onClick={() => openInMaps(dropoffLocation, 'Dropoff')}
              className="px-4 py-2 bg-success text-white rounded-button text-sm font-semibold hover:bg-success/90"
            >
              Navigate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapView

