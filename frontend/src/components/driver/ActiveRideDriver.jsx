import { useState } from 'react'
import { FaMapMarkerAlt, FaUser, FaInfoCircle, FaMap } from 'react-icons/fa'
import MapView from './MapView'

const ActiveRideDriver = ({ ride, onUpdate, onReachPickup, onCompleteRide, loading = false }) => {
  const [showTripDetails, setShowTripDetails] = useState(false)
  const [showMapView, setShowMapView] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-accent-secondary animate-pulse'
      case 'accepted':
        return 'text-accent-secondary'
      case 'in-progress':
        return 'text-blue-400'
      case 'completed':
        return 'text-green-400'
      default:
        return 'text-text-secondary'
    }
  }

  if (!ride) return null

  return (
    <div className="bg-surface border border-border rounded-button p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Active Ride</h3>
          {ride.rideId && (
            <div className="text-xs text-text-secondary mb-2">
              Ride ID: <span className="font-semibold text-accent">{ride.rideId}</span>
            </div>
          )}
          {ride.rideType && (
            <div className="text-xs text-text-secondary mb-2">
              Ride Type: <span className="font-semibold capitalize text-accent">{ride.rideType}</span>
            </div>
          )}
          {ride.paymentMethod && (
            <div className="text-xs text-text-secondary mb-2">
              Payment: <span className="font-semibold capitalize text-accent">{ride.paymentMethod === 'wallet' || ride.paymentMethod === 'prepaid' ? 'Wallet' : ride.paymentMethod === 'online' || ride.paymentMethod === 'card' ? 'Online' : 'Cash'}</span>
            </div>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ride.status)}`}>
            {ride.status === 'pending' && '🔍 Searching...'}
            {ride.status === 'accepted' && '✅ Ride Accepted'}
            {ride.status === 'in-progress' && '🚗 Ride Started'}
            {ride.status === 'completed' && '✓ Completed'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start">
          <FaMapMarkerAlt className="text-accent-secondary mt-1 mr-3" />
          <div className="flex-1">
            <div className="text-sm text-text-secondary">Pickup</div>
            <div className="text-text-primary font-medium">{ride.pickupLocation.address}</div>
          </div>
        </div>
        <div className="flex items-start">
          <FaMapMarkerAlt className="text-accent-secondary mt-1 mr-3" />
          <div className="flex-1">
            <div className="text-sm text-text-secondary">Dropoff</div>
            <div className="text-text-primary font-medium">{ride.dropoffLocation.address}</div>
          </div>
        </div>

        {ride.userId && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <FaUser className="text-accent-secondary text-xl" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-text-primary">
                  {ride.userId?.name || 'Passenger'}
                </div>
                <div className="text-sm text-text-secondary">
                  {ride.userId?.phone ? (() => {
                    const phone = ride.userId.phone.toString()
                    if (phone.length >= 5) {
                      const first2 = phone.slice(0, 2)
                      const last3 = phone.slice(-3)
                      const masked = '*'.repeat(phone.length - 5)
                      return `${first2}${masked}${last3}`
                    }
                    return phone
                  })() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {ride.status === 'accepted' && (
            <>
              <button
                onClick={() => setShowMapView(true)}
                className="flex-1 bg-accent text-text-light px-4 py-2 rounded-button font-semibold hover:bg-accent-hover transition flex items-center justify-center"
              >
                <FaMap className="mr-2" />
                View on Map
              </button>
              {onReachPickup && (
                <button
                  onClick={() => onReachPickup(ride._id)}
                  disabled={loading}
                  className="flex-1 bg-success text-text-light px-4 py-2 rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition"
                >
                  Mark Reached Pickup
                </button>
              )}
            </>
          )}
          {ride.status === 'in-progress' && onCompleteRide && (
            <button
              onClick={() => onCompleteRide(ride._id)}
              disabled={loading}
              className="w-full bg-success text-text-light px-4 py-2 rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition"
            >
              Complete Ride
            </button>
          )}
          <button
            onClick={() => setShowTripDetails(!showTripDetails)}
            className="flex-1 px-4 py-2 bg-surface border border-border rounded-button text-text-primary hover:bg-secondary transition flex items-center justify-center"
          >
            <FaInfoCircle className="mr-2" />
            Trip Details
          </button>
        </div>

        {showTripDetails && (
          <div className="bg-surface border border-border rounded-button p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary">Distance:</span>
              <span className="text-text-primary font-medium">{ride.distance} km</span>
            </div>
            {ride.originalFare && ride.originalFare > ride.fare && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Original Fare:</span>
                <span className="text-text-primary line-through">₹{ride.originalFare.toFixed(2)}</span>
              </div>
            )}
            {ride.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Discount:</span>
                <span className="text-success">-₹{ride.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-text-primary font-semibold">Total Fare:</span>
              <span className="text-accent-secondary text-xl font-bold">₹{ride.fare.toFixed(2)}</span>
            </div>
            {ride.couponCode && (
              <div className="text-xs text-text-secondary mt-2">
                Coupon applied: {ride.couponCode}
              </div>
            )}
          </div>
        )}
      </div>

      {showMapView && (
        <MapView
          pickupLocation={ride.pickupLocation}
          dropoffLocation={ride.dropoffLocation}
          onClose={() => setShowMapView(false)}
        />
      )}
    </div>
  )
}

export default ActiveRideDriver

