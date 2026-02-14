import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaMapMarkerAlt, FaCar, FaMotorcycle, FaTag } from 'react-icons/fa'
import LeafletPlacesInput from './LeafletPlacesInput'

const BookRide = ({ onRideBooked, activeRide }) => {
  const [formData, setFormData] = useState({
    pickupLocation: {
      address: '',
      latitude: 0,
      longitude: 0
    },
    dropoffLocation: {
      address: '',
      latitude: 0,
      longitude: 0
    },
    vehicleType: 'bike',
    paymentMethod: 'cash',
    couponCode: '',
    rideType: 'personal'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [estimatedFare, setEstimatedFare] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  const calculateFare = (distance, vehicleType) => {
    const baseFare = { bike: 20, auto: 30, car: 50 }
    const perKm = { bike: 5, auto: 8, car: 12 }
    return baseFare[vehicleType] + (distance * perKm[vehicleType])
  }

  const handlePlaceSelect = (locationType, place) => {
    const updatedFormData = {
      ...formData,
      [locationType]: place
    }
    setFormData(updatedFormData)
    
    // Calculate distance and fare after state update
    setTimeout(() => {
      const pickup = locationType === 'pickupLocation' ? place : updatedFormData.pickupLocation
      const dropoff = locationType === 'dropoffLocation' ? place : updatedFormData.dropoffLocation
      
      if (pickup.latitude && pickup.longitude && dropoff.latitude && dropoff.longitude) {
        const R = 6371 // Earth's radius in km
        const dLat = (dropoff.latitude - pickup.latitude) * Math.PI / 180
        const dLon = (dropoff.longitude - pickup.longitude) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(pickup.latitude * Math.PI / 180) * Math.cos(dropoff.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c
        const fare = calculateFare(distance, updatedFormData.vehicleType)
        setEstimatedFare(fare)
      }
    }, 100)
  }

  const calculateDistanceAndFare = () => {
    const lat1 = formData.pickupLocation.latitude
    const lon1 = formData.pickupLocation.longitude
    const lat2 = formData.dropoffLocation.latitude
    const lon2 = formData.dropoffLocation.longitude

    if (lat1 && lon1 && lat2 && lon2) {
      // Calculate distance using Haversine formula
      const R = 6371 // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c

      const fare = calculateFare(distance, formData.vehicleType)
      setEstimatedFare(fare)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name !== 'pickupAddress' && name !== 'dropoffAddress') {
      setFormData({
        ...formData,
        [name]: value
      })
      if (name === 'vehicleType' && formData.pickupLocation.address && formData.dropoffLocation.address) {
        calculateDistanceAndFare()
      }
    }
  }

  const handleApplyCoupon = async () => {
    if (!formData.couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }

    if (!estimatedFare) {
      setCouponError('Please enter pickup and dropoff locations first')
      return
    }

    try {
      const res = await axios.post('/api/coupons/validate', {
        code: formData.couponCode,
        amount: estimatedFare
      })
      setCouponApplied(true)
      setCouponError('')
      setDiscountAmount(res.data.discountAmount)
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code')
      setCouponApplied(false)
      setDiscountAmount(0)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponApplied(false)
    setCouponError('')
    setDiscountAmount(0)
    setFormData({ ...formData, couponCode: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const rideData = {
        ...formData,
        couponCode: couponApplied ? formData.couponCode : null
      }
      const res = await axios.post('/api/rides', rideData)
      setSuccess('Ride booked successfully!')
      setFormData({
        pickupLocation: { address: '', latitude: 0, longitude: 0 },
        dropoffLocation: { address: '', latitude: 0, longitude: 0 },
        vehicleType: 'bike',
        paymentMethod: 'cash',
        couponCode: '',
        rideType: 'personal'
      })
      setCouponApplied(false)
      setDiscountAmount(0)
      setEstimatedFare(null)
      // Call callback to refresh wallet and transactions
      if (onRideBooked) {
        onRideBooked()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book ride')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">Book a Ride</h2>

      {activeRide && (
        <div className="bg-warning/10 border border-warning text-warning px-4 py-3 rounded-button mb-4">
          <div className="font-semibold mb-1">You have an active ride</div>
          <div className="text-sm">
            Please complete or cancel your current ride before booking a new one.
            {activeRide.rideId && (
              <span className="ml-1">Current Ride ID: {activeRide.rideId}</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-button mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-button mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <FaMapMarkerAlt className="inline mr-2 text-accent-secondary" />
            Pickup Location
          </label>
          <LeafletPlacesInput
            value={formData.pickupLocation.address || ''}
            onChange={(value) => {
              setFormData({
                ...formData,
                pickupLocation: { ...formData.pickupLocation, address: value }
              })
            }}
            onPlaceSelect={(place) => {
              console.log('Place selected for pickup:', place)
              handlePlaceSelect('pickupLocation', place)
            }}
            placeholder="Enter pickup address"
            disabled={!!activeRide}
          />
          {formData.pickupLocation.address && formData.pickupLocation.latitude && (
            <div className="mt-2 p-3 bg-accent/10 border border-accent/20 rounded-button">
              <div className="text-xs text-text-secondary mb-1">Selected Location:</div>
              <div className="text-sm font-semibold text-text-primary">{formData.pickupLocation.address}</div>
              <div className="text-xs text-text-secondary mt-1">
                Coordinates: {formData.pickupLocation.latitude.toFixed(6)}, {formData.pickupLocation.longitude.toFixed(6)}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <FaMapMarkerAlt className="inline mr-2 text-accent" />
            Dropoff Location
          </label>
          <LeafletPlacesInput
            value={formData.dropoffLocation.address || ''}
            onChange={(value) => {
              setFormData({
                ...formData,
                dropoffLocation: { ...formData.dropoffLocation, address: value }
              })
            }}
            onPlaceSelect={(place) => {
              console.log('Place selected for dropoff:', place)
              handlePlaceSelect('dropoffLocation', place)
            }}
            placeholder="Enter dropoff address"
            disabled={!!activeRide}
          />
          {formData.dropoffLocation.address && formData.dropoffLocation.latitude && (
            <div className="mt-2 p-3 bg-accent/10 border border-accent/20 rounded-button">
              <div className="text-xs text-text-secondary mb-1">Selected Location:</div>
              <div className="text-sm font-semibold text-text-primary">{formData.dropoffLocation.address}</div>
              <div className="text-xs text-text-secondary mt-1">
                Coordinates: {formData.dropoffLocation.latitude.toFixed(6)}, {formData.dropoffLocation.longitude.toFixed(6)}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Vehicle Type
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, vehicleType: 'bike' })}
              disabled={!!activeRide}
              className={`p-3 sm:p-4 border-2 rounded-button text-center transition ${
                formData.vehicleType === 'bike'
                  ? 'border-accent bg-accent/20'
                  : 'border-border hover:border-accent/50 bg-surface'
              } ${activeRide ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaMotorcycle className="text-2xl sm:text-3xl mx-auto mb-1 sm:mb-2 text-accent-secondary" />
              <div className="font-semibold text-text-primary text-sm sm:text-base">Bike</div>
              <div className="text-xs sm:text-sm text-text-secondary">₹20 base</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, vehicleType: 'auto' })}
              disabled={!!activeRide}
              className={`p-3 sm:p-4 border-2 rounded-button text-center transition ${
                formData.vehicleType === 'auto'
                  ? 'border-accent bg-accent/20'
                  : 'border-border hover:border-accent/50 bg-surface'
              } ${activeRide ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaCar className="text-2xl sm:text-3xl mx-auto mb-1 sm:mb-2 text-accent-secondary" />
              <div className="font-semibold text-text-primary text-sm sm:text-base">Auto</div>
              <div className="text-xs sm:text-sm text-text-secondary">₹30 base</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, vehicleType: 'car' })}
              disabled={!!activeRide}
              className={`p-3 sm:p-4 border-2 rounded-button text-center transition ${
                formData.vehicleType === 'car'
                  ? 'border-accent bg-accent/20'
                  : 'border-border hover:border-accent/50 bg-surface'
              } ${activeRide ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaCar className="text-2xl sm:text-3xl mx-auto mb-1 sm:mb-2 text-accent-secondary" />
              <div className="font-semibold text-text-primary text-sm sm:text-base">Car</div>
              <div className="text-xs sm:text-sm text-text-secondary">₹50 base</div>
            </button>
          </div>
        </div>

        {estimatedFare && (
          <div className="bg-surface border border-border rounded-button p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-text-secondary">Estimated Fare:</span>
              <span className="text-xl font-bold text-text-primary">₹{estimatedFare.toFixed(2)}</span>
            </div>
            {couponApplied && discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Discount:</span>
                <span className="text-success">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {couponApplied && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                <span className="text-text-secondary">Final Fare:</span>
                <span className="text-lg font-bold text-accent-secondary">₹{(estimatedFare - discountAmount).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <FaTag className="inline mr-2" />
            Coupon Code (Optional)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              name="couponCode"
              value={formData.couponCode}
              onChange={handleChange}
              disabled={couponApplied || !!activeRide}
              className="flex-1 px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 text-sm sm:text-base"
              placeholder="Enter coupon code"
            />
            {!couponApplied ? (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={loading || !!activeRide}
                className="px-4 sm:px-6 py-2 bg-accent text-text-light rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50 text-sm sm:text-base"
              >
                Apply
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                disabled={loading || !!activeRide}
                className="px-4 sm:px-6 py-2 bg-danger text-text-light rounded-button font-semibold hover:bg-danger/90 transition disabled:opacity-50 text-sm sm:text-base"
              >
                Remove
              </button>
            )}
          </div>
          {couponError && (
            <p className="mt-2 text-sm text-danger">{couponError}</p>
          )}
          {couponApplied && (
            <p className="mt-2 text-sm text-success">Coupon applied successfully!</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Ride Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, rideType: 'personal' })}
              disabled={!!activeRide}
              className={`p-4 border-2 rounded-button text-center transition ${
                formData.rideType === 'personal'
                  ? 'border-accent bg-accent/20'
                  : 'border-border hover:border-accent/50 bg-surface'
              } ${activeRide ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-semibold text-text-primary">Personal</div>
              <div className="text-xs text-text-secondary mt-1">Single booking</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, rideType: 'sharing' })}
              disabled={!!activeRide}
              className={`p-4 border-2 rounded-button text-center transition ${
                formData.rideType === 'sharing'
                  ? 'border-accent bg-accent/20'
                  : 'border-border hover:border-accent/50 bg-surface'
              } ${activeRide ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-semibold text-text-primary">Sharing</div>
              <div className="text-xs text-text-secondary mt-1">Share with others</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Payment Method
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            disabled={!!activeRide}
            className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
          >
            <option value="cash">Cash</option>
            <option value="prepaid">Prepaid (Wallet)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !!activeRide}
          className="w-full bg-accent text-text-light py-3 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50"
        >
          {loading ? 'Booking...' : activeRide ? 'Cannot Book - Active Ride Exists' : 'Book Ride'}
        </button>
      </form>
    </div>
  )
}

export default BookRide
