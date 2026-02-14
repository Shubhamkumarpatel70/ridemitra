import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaMapMarkerAlt, FaClock, FaRupeeSign, FaStar } from 'react-icons/fa'
import FeedbackForm from './FeedbackForm'

const RideHistory = () => {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRides()
  }, [])

  const fetchRides = async () => {
    try {
      const res = await axios.get('/api/rides')
      setRides(res.data)
    } catch (error) {
      console.error('Error fetching rides:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success'
      case 'cancelled':
        return 'bg-danger/20 text-danger'
      case 'in-progress':
        return 'bg-accent/20 text-accent'
      case 'accepted':
        return 'bg-warning/20 text-warning'
      default:
        return 'bg-secondary text-text-secondary'
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-text-secondary">Loading...</div>
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">Ride History</h2>
      {rides.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p>No rides yet. Book your first ride!</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {rides.map((ride) => (
            <div key={ride._id} className="bg-surface border border-border rounded-button p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ride.status)}`}>
                      {ride.status.toUpperCase()}
                    </span>
                    {ride.rideId && (
                      <span className="text-xs text-text-secondary">
                        ID: <span className="font-semibold text-accent">{ride.rideId}</span>
                      </span>
                    )}
                    {ride.rideType && (
                      <span className="text-xs text-text-secondary">
                        Type: <span className="font-semibold capitalize text-accent">{ride.rideType}</span>
                      </span>
                    )}
                    {ride.paymentMethod && (
                      <span className="text-xs text-text-secondary">
                        Payment: <span className="font-semibold capitalize text-accent">{ride.paymentMethod === 'wallet' || ride.paymentMethod === 'prepaid' ? 'Wallet' : ride.paymentMethod === 'online' || ride.paymentMethod === 'card' ? 'Online' : 'Cash'}</span>
                      </span>
                    )}
                    <span className="text-xs sm:text-sm text-text-secondary">
                      <FaClock className="inline mr-1" />
                      {new Date(ride.bookingTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-accent-secondary mt-1 mr-2 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-text-secondary">From</div>
                        <div className="font-medium text-text-primary text-sm sm:text-base break-words">{ride.pickupLocation.address}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-accent mt-1 mr-2 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-text-secondary">To</div>
                        <div className="font-medium text-text-primary text-sm sm:text-base break-words">{ride.dropoffLocation.address}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-accent-secondary">
                    <FaRupeeSign className="inline" />
                    {ride.fare}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">{ride.distance} km</div>
                  <div className="text-xs sm:text-sm text-text-secondary capitalize">{ride.vehicleType}</div>
                </div>
              </div>
              {ride.driverId && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-sm text-text-secondary">
                    Driver: {ride.driverId.userId?.name || 'N/A'} - {ride.driverId.vehicleType} - {ride.driverId.vehicleNumber}
                  </div>
                </div>
              )}
              {ride.status === 'completed' && !ride.rating && (
                <FeedbackForm 
                  ride={ride} 
                  onSubmitted={() => {
                    fetchRides()
                  }} 
                />
              )}
              {ride.rating && (
                <div className="mt-2 flex items-center">
                  <FaStar className="text-yellow-400 mr-1" />
                  <span className="font-semibold text-text-primary">{ride.rating}</span>
                  {ride.review && <span className="ml-2 text-text-secondary">- {ride.review}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RideHistory
