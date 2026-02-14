import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaTimes, FaStar, FaCar, FaUser, FaCheckCircle } from 'react-icons/fa'

const DriverDetailsModal = ({ driverId, isOpen, onClose }) => {
  const [driverDetails, setDriverDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (isOpen && driverId) {
      fetchDriverDetails()
    }
  }, [isOpen, driverId])

  const fetchDriverDetails = async () => {
    setLoading(true)
    try {
      // Fetch driver profile
      const driverRes = await axios.get(`/api/driver/profile-by-id/${driverId}`)
      setDriverDetails(driverRes.data)

      // Fetch driver stats (completed rides, ratings)
      try {
        const statsRes = await axios.get(`/api/driver/stats/${driverId}`)
        setStats(statsRes.data)
      } catch (err) {
        // If stats endpoint fails, calculate from driver data
        console.error('Error fetching stats:', err)
        setStats({
          totalRides: driverRes.data.totalRides || 0,
          completedRides: driverRes.data.totalRides || 0,
          totalEarnings: driverRes.data.earnings || 0,
          rating: driverRes.data.rating || 0
        })
      }
    } catch (error) {
      console.error('Error fetching driver details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border rounded-button p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-text-primary">Driver Details</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-text-secondary">Loading...</div>
        ) : driverDetails ? (
          <div className="space-y-4">
            {/* Driver Profile Section */}
            <div className="flex items-center space-x-4 pb-4 border-b border-border">
              {driverDetails.profileImage ? (
                <img 
                  src={`http://localhost:5000${driverDetails.profileImage}`} 
                  alt="Driver" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-accent"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent">
                  <FaUser className="text-3xl text-accent-secondary" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="text-xl font-bold text-text-primary">
                  {driverDetails.userId?.name || 'Driver'}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <FaStar className="text-yellow-400" />
                  <span className="font-semibold text-text-primary">
                    {driverDetails.rating ? driverDetails.rating.toFixed(1) : 'N/A'}
                  </span>
                  {stats && (
                    <span className="text-text-secondary">
                      ({stats.totalRides} {stats.totalRides === 1 ? 'ride' : 'rides'})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FaCar className="text-accent-secondary" />
                <div>
                  <div className="text-sm text-text-secondary">Vehicle</div>
                  <div className="text-text-primary font-semibold capitalize">
                    {driverDetails.vehicleType} - {driverDetails.vehicleNumber}
                  </div>
                </div>
              </div>
              {driverDetails.vehicleModel && (
                <div>
                  <div className="text-sm text-text-secondary">Model</div>
                  <div className="text-text-primary font-semibold">{driverDetails.vehicleModel}</div>
                </div>
              )}
            </div>

            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="bg-accent/10 rounded-button p-4 text-center">
                  <div className="text-2xl font-bold text-accent">{stats.totalRides}</div>
                  <div className="text-xs text-text-secondary mt-1">Total Rides</div>
                </div>
                <div className="bg-success/10 rounded-button p-4 text-center">
                  <div className="text-2xl font-bold text-success">{stats.completedRides}</div>
                  <div className="text-xs text-text-secondary mt-1">Completed</div>
                </div>
                <div className="bg-warning/10 rounded-button p-4 text-center col-span-2">
                  <div className="text-2xl font-bold text-warning">
                    {driverDetails.rating ? driverDetails.rating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">Average Rating</div>
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center space-x-2">
                {driverDetails.isVerified ? (
                  <>
                    <FaCheckCircle className="text-success" />
                    <span className="text-sm text-success font-semibold">Verified Driver</span>
                  </>
                ) : (
                  <span className="text-sm text-warning font-semibold">Verification Pending</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">Driver details not found</div>
        )}
      </div>
    </div>
  )
}

export default DriverDetailsModal

