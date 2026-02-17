import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { FaVideo, FaUser, FaCalendar, FaClock, FaCheckCircle } from 'react-icons/fa'
import DriverVideoCall from '../components/driver/DriverVideoCall'

const VKYCSchedule = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [driverProfile, setDriverProfile] = useState(null)
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [callId, setCallId] = useState(null)
  const [driverId, setDriverId] = useState(null)

  useEffect(() => {
    fetchDriverProfile()
  }, [])

  const fetchDriverProfile = async () => {
    try {
      const res = await axios.get('/api/driver/profile')
      setDriverProfile(res.data)
      if (res.data.vkycScheduledAt) {
        const date = new Date(res.data.vkycScheduledAt)
        setScheduledTime(date.toISOString().slice(0, 16))
      }
    } catch (error) {
      console.error('Error fetching driver profile:', error)
    }
  }

  const handleSchedule = async (e) => {
    e.preventDefault()
    if (!scheduledTime) {
      setError('Please select a date and time')
      return
    }

    setLoading(true)
    setError('')
    try {
      await axios.post('/api/driver/vkyc/schedule', {
        scheduledAt: scheduledTime
      })
      setSuccess('VKYC call scheduled successfully! Admin will join at the scheduled time.')
      fetchDriverProfile()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to schedule VKYC call')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCall = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axios.post('/api/driver/vkyc/join')
      if (res.data.callId) {
        setCallId(res.data.callId)
        setDriverId(res.data.driverId || driverProfile?._id)
        setShowVideoCall(true)
        // Refresh profile to update status
        fetchDriverProfile()
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join call'
      setError(message)
      fetchDriverProfile()
    } finally {
      setLoading(false)
    }
  }

  const handleEndCall = async () => {
    setShowVideoCall(false)
    setCallId(null)
    // Refresh profile
    fetchDriverProfile()
  }

  return (
    <>
      {showVideoCall && callId && (
        <DriverVideoCall callId={callId} driverId={driverId || driverProfile?._id} onClose={handleEndCall} />
      )}
      <div className="min-h-screen bg-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-surface border border-border rounded-button p-6 sm:p-8">
          <div className="flex items-center mb-6">
            <FaVideo className="text-accent text-3xl mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Schedule VKYC Call</h1>
          </div>

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

          {/* Driver Details */}
          <div className="bg-secondary border border-border rounded-button p-6 mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
              <FaUser className="mr-2 text-accent" />
              Your Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-text-secondary mb-1">Name</div>
                <div className="text-text-primary font-medium">{driverProfile?.userId?.name || user?.name}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-1">Email</div>
                <div className="text-text-primary font-medium">{driverProfile?.userId?.email || user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-1">Phone</div>
                <div className="text-text-primary font-medium">{driverProfile?.userId?.phone || user?.phone}</div>
              </div>
              {driverProfile?.licenseNumber && (
                <div>
                  <div className="text-sm text-text-secondary mb-1">License Number</div>
                  <div className="text-text-primary font-medium">{driverProfile.licenseNumber}</div>
                </div>
              )}
              {driverProfile?.vehicleType && (
                <div>
                  <div className="text-sm text-text-secondary mb-1">Vehicle Type</div>
                  <div className="text-text-primary font-medium capitalize">{driverProfile.vehicleType}</div>
                </div>
              )}
              {driverProfile?.vehicleNumber && (
                <div>
                  <div className="text-sm text-text-secondary mb-1">Vehicle Number</div>
                  <div className="text-text-primary font-medium">{driverProfile.vehicleNumber}</div>
                </div>
              )}
            </div>
          </div>

          {/* VKYC Status */}
          {driverProfile?.vkycStatus && (
            <div className="bg-accent/10 border border-accent rounded-button p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary mb-1">VKYC Status</div>
                  <div className="text-lg font-semibold text-text-primary capitalize">
                    {driverProfile.vkycStatus === 'scheduled' && 'Scheduled'}
                    {driverProfile.vkycStatus === 'in-progress' && 'In Progress'}
                    {driverProfile.vkycStatus === 'completed' && 'Completed'}
                    {driverProfile.vkycStatus === 'failed' && 'Failed'}
                    {driverProfile.vkycStatus === 'not-scheduled' && 'Not Scheduled'}
                  </div>
                  {driverProfile.vkycScheduledAt && (
                    <div className="text-sm text-text-secondary mt-2">
                      <FaCalendar className="inline mr-1" />
                      Scheduled for: {new Date(driverProfile.vkycScheduledAt).toLocaleString()}
                    </div>
                  )}
                </div>
                {(driverProfile.vkycStatus === 'scheduled' || driverProfile.vkycStatus === 'in-progress') && (
                  <button
                    onClick={handleJoinCall}
                    disabled={loading || showVideoCall}
                    className="bg-accent text-text-light px-6 py-3 rounded-button font-semibold hover:bg-accent-hover transition flex items-center disabled:opacity-50"
                  >
                    <FaVideo className="mr-2" />
                    {showVideoCall ? 'In Call...' : 'Join Call'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VKYC Completed Message */}
          {driverProfile?.vkycStatus === 'completed' && (
            <div className="bg-success/10 border border-success rounded-button p-6 mb-6">
              <div className="flex items-center space-x-3">
                <FaCheckCircle className="text-success text-3xl" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-text-primary">VKYC Completed</h3>
                  <p className="text-text-secondary mt-2">
                    Your VKYC verification has been completed successfully. Your account is under review and you'll be able to accept rides once approved by admin.
                  </p>
                  {driverProfile.vkycCompletedAt && (
                    <p className="text-sm text-text-secondary mt-2">
                      Completed on: {new Date(driverProfile.vkycCompletedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Form */}
          {driverProfile?.vkycStatus !== 'completed' && (!driverProfile?.vkycScheduledAt || driverProfile?.vkycStatus === 'not-scheduled') && (
            <form onSubmit={handleSchedule} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <FaCalendar className="inline mr-2 text-accent" />
                  Select Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                  required
                />
                <p className="text-xs text-text-secondary mt-2">
                  Please select a date and time when you'll be available for the video call
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-text-light py-3 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? 'Scheduling...' : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Schedule VKYC Call
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-3">What is VKYC?</h3>
            <ul className="space-y-2 text-text-secondary text-sm">
              <li className="flex items-start">
                <FaCheckCircle className="text-accent mr-2 mt-1 flex-shrink-0" />
                <span>Video KYC (Know Your Customer) is a verification process conducted via video call</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-accent mr-2 mt-1 flex-shrink-0" />
                <span>An admin will verify your identity and documents during the call</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-accent mr-2 mt-1 flex-shrink-0" />
                <span>Please have your Aadhar card, PAN card, and driving license ready</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-accent mr-2 mt-1 flex-shrink-0" />
                <span>The call will be recorded for verification purposes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default VKYCSchedule

