import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaMapMarkerAlt, FaUser, FaCar, FaClock, FaKey, FaInfoCircle, FaTimes } from 'react-icons/fa'
import { API_URL } from '../../config'
import DriverDetailsModal from './DriverDetailsModal'

const ActiveRide = ({ ride, onUpdate }) => {
  const [otp, setOtp] = useState(null)
  const [waitingTime, setWaitingTime] = useState(60) // 1 minute
  const [showTripDetails, setShowTripDetails] = useState(false)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) {
      return
    }
    setCancelling(true)
    try {
      await axios.put(`/api/rides/${ride._id}/cancel`)
      if (onUpdate) {
        onUpdate()
      }
      alert('Ride cancelled successfully')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel ride')
    } finally {
      setCancelling(false)
    }
  }

  useEffect(() => {
    if (ride && (ride.status === 'pending' || ride.status === 'accepted')) {
      fetchOTP()
      const timer = setInterval(() => {
        setWaitingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [ride])

  useEffect(() => {
    if (ride?.status === 'accepted' && ride.driverId) {
      fetchOTP()
      const interval = setInterval(fetchOTP, 5000) // Poll for OTP every 5 seconds
      return () => clearInterval(interval)
    }
  }, [ride?.status, ride?.driverId])

  const fetchOTP = async () => {
    if (!ride || ride.status !== 'accepted' || !ride.driverId) {
      return
    }
    try {
      const res = await axios.get(`/api/otp/${ride._id}`)
      if (res.data && res.data.code) {
        setOtp(res.data.code)
      }
    } catch (error) {
      // OTP might not exist yet, that's okay
      if (error.response?.status !== 404) {
        console.error('Error fetching OTP:', error)
      }
    }
  }

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
            {ride.status === 'pending' && '🔍 Searching for driver...'}
            {ride.status === 'accepted' && '✅ Driver Assigned'}
            {ride.status === 'in-progress' && '🚗 Ride Started'}
            {ride.status === 'completed' && '✓ Completed'}
            {ride.status === 'cancelled' && '❌ Cancelled'}
          </span>
        </div>
        {ride.status === 'pending' && (
          <div className="text-right">
            <div className="text-sm text-text-secondary">Waiting Time</div>
            <div className="text-2xl font-bold text-accent-secondary">{waitingTime}s</div>
          </div>
        )}
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

        {ride.status === 'accepted' && ride.driverId && (
          <>
            <div className="border-t border-border pt-4">
              <div className="flex items-center space-x-4 mb-4">
                {ride.driverId.profileImage ? (
                  <img 
                    src={`${API_URL}${ride.driverId.profileImage}`} 
                    alt="Driver" 
                    onClick={() => setShowDriverModal(true)}
                    className="w-16 h-16 rounded-full object-cover border-2 border-accent cursor-pointer hover:opacity-80 transition"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      const fallback = e.target.nextSibling
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : (
                  <div 
                    className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition"
                    onClick={() => setShowDriverModal(true)}
                  >
                    <FaUser className="text-2xl text-accent-secondary" />
                  </div>
                )}
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => setShowDriverModal(true)}
                >
                  <div className="text-lg font-semibold text-text-primary hover:text-accent transition">
                    {ride.driverId.userId?.name || 'Driver'}
                  </div>
                  <div className="text-sm text-text-secondary flex items-center">
                    <FaCar className="mr-2" />
                    {ride.driverId.vehicleType} - {ride.driverId.vehicleNumber}
                  </div>
                  <div className="text-sm text-text-secondary">{ride.driverId.vehicleModel}</div>
                </div>
              </div>
            </div>
            
            <DriverDetailsModal
              driverId={ride.driverId._id}
              isOpen={showDriverModal}
              onClose={() => setShowDriverModal(false)}
            />

            {otp && (
              <div className="bg-accent/10 border border-accent rounded-button p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaKey className="text-accent-secondary mr-2" />
                    <span className="text-text-secondary">Your OTP:</span>
                  </div>
                  <div className="text-3xl font-bold text-accent-secondary tracking-wider">{otp}</div>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Share this OTP with your driver to start the ride
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex gap-2">
          {(ride.status === 'pending' || ride.status === 'accepted') && (
            <button
              onClick={handleCancelRide}
              disabled={cancelling}
              className="px-4 py-2 bg-danger text-text-light rounded-button font-semibold hover:bg-danger/90 transition flex items-center justify-center disabled:opacity-50"
            >
              <FaTimes className="mr-2" />
              {cancelling ? 'Cancelling...' : 'Cancel Ride'}
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
    </div>
  )
}

export default ActiveRide

