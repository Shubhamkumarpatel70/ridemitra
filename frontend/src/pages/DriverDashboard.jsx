import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaCar, FaSignOutAlt, FaCheckCircle, FaTimesCircle, FaHistory, FaRupeeSign, FaStar, FaMapMarkerAlt, FaKey, FaExclamationTriangle, FaMap, FaWallet, FaVideo, FaExchangeAlt } from 'react-icons/fa'
import VehicleDetailsForm from '../components/driver/VehicleDetailsForm'
import MapView from '../components/driver/MapView'
import ActiveRideDriver from '../components/driver/ActiveRideDriver'

const DriverDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on mount
    return localStorage.getItem('driverActiveTab') || 'pending'
  })
  const [pendingRides, setPendingRides] = useState([])
  const [myRides, setMyRides] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(false)
  const [otpVerification, setOtpVerification] = useState({ show: false, rideId: null, otpCode: '' })
  const [driverProfile, setDriverProfile] = useState(null)
  const [hasActiveRide, setHasActiveRide] = useState(false)
  const [showMapView, setShowMapView] = useState(false)
  const [selectedRide, setSelectedRide] = useState(null)
  const [activeRide, setActiveRide] = useState(null)
  const [wallet, setWallet] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState({ show: false, ride: null })
  const [transactions, setTransactions] = useState([])
  const [accountDetails, setAccountDetails] = useState(null)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [accountForm, setAccountForm] = useState({ accountNumber: '', confirmAccountNumber: '', ifscCode: '', accountHolderName: '' })
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawals, setWithdrawals] = useState([])

  useEffect(() => {
    fetchAvailability()
  }, [])

  useEffect(() => {
    fetchActiveRide()
    fetchWallet()
    const interval = setInterval(() => {
      fetchActiveRide()
      fetchWallet()
    }, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Auto update driver location
  useEffect(() => {
    if (navigator.geolocation) {
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await axios.put('/api/driver/location', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              })
            } catch (error) {
              console.error('Error updating location:', error)
            }
          },
          (error) => {
            console.error('Error getting location:', error)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      }

      // Update location immediately
      updateLocation()
      
      // Update location every 30 seconds
      const locationInterval = setInterval(updateLocation, 30000)
      
      return () => clearInterval(locationInterval)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
    if (activeTab === 'earnings') {
      fetchAccountDetails()
      fetchWithdrawals()
    }
    if (activeTab === 'pending') {
      fetchPendingRides()
      // Poll for new rides every 3 seconds when on pending tab
      const interval = setInterval(() => {
        fetchPendingRides()
      }, 3000)
      return () => clearInterval(interval)
    } else if (activeTab === 'myRides') {
      fetchMyRides()
    } else if (activeTab === 'earnings') {
      fetchEarnings()
    }
  }, [activeTab])

  const fetchActiveRide = async () => {
    try {
      const res = await axios.get('/api/rides')
      const active = res.data.find(r => 
        r.status === 'accepted' || r.status === 'in-progress'
      )
      if (active) {
        const fullRide = await axios.get(`/api/rides/${active._id}`)
        setActiveRide(fullRide.data)
        setHasActiveRide(true)
      } else {
        setActiveRide(null)
        setHasActiveRide(false)
      }
    } catch (error) {
      console.error('Error fetching active ride:', error)
    }
  }

  const fetchPendingRides = async () => {
    try {
      const res = await axios.get('/api/driver/rides/pending')
      // Sort by booking time (newest first) and update state
      const sortedRides = (res.data || []).sort((a, b) => {
        const timeA = new Date(a.bookingTime || 0).getTime()
        const timeB = new Date(b.bookingTime || 0).getTime()
        return timeB - timeA
      })
      setPendingRides(sortedRides)
    } catch (error) {
      // If error is due to verification or vehicle details, show empty array silently
      if (error.response?.status === 403 || error.response?.status === 400) {
        const message = error.response?.data?.message || ''
        // Only log if it's not an expected verification/vehicle error
        if (!message.includes('verified') && !message.includes('vehicle details')) {
          console.error('Error fetching pending rides:', error)
        }
        setPendingRides([])
      } else {
        // Log other errors
        console.error('Error fetching pending rides:', error)
      }
    }
  }

  const fetchMyRides = async () => {
    try {
      const res = await axios.get('/api/rides')
      setMyRides(res.data)
    } catch (error) {
      console.error('Error fetching my rides:', error)
    }
  }

  const fetchEarnings = async () => {
    try {
      const res = await axios.get('/api/driver/earnings')
      setEarnings(res.data)
      // Update wallet from earnings
      if (res.data.totalEarnings !== undefined) {
        setWallet(res.data.totalEarnings)
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
    }
  }

  const fetchWallet = async () => {
    try {
      const res = await axios.get('/api/driver/earnings')
      if (res.data && res.data.totalEarnings !== undefined) {
        setWallet(res.data.totalEarnings || 0)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/driver/transactions')
      setTransactions(res.data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchAccountDetails = async () => {
    try {
      const res = await axios.get('/api/driver/account-details')
      setAccountDetails(res.data.accountDetails)
    } catch (error) {
      console.error('Error fetching account details:', error)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get('/api/driver/withdraw-requests')
      setWithdrawals(res.data || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }

  const saveAccountDetails = async (e) => {
    e.preventDefault()
    if (accountForm.accountNumber !== accountForm.confirmAccountNumber) {
      alert('Account numbers do not match')
      return
    }
    setLoading(true)
    try {
      await axios.put('/api/driver/account-details', accountForm)
      await fetchAccountDetails()
      setShowAccountForm(false)
      setAccountForm({ accountNumber: '', confirmAccountNumber: '', ifscCode: '', accountHolderName: '' })
      alert('Account details saved successfully')
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save account details')
    } finally {
      setLoading(false)
    }
  }

  const requestWithdrawal = async (e) => {
    e.preventDefault()
    if (!accountDetails) {
      alert('Please add account details first')
      return
    }
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    if (earnings && earnings.totalEarnings < parseFloat(withdrawalAmount)) {
      alert('Insufficient earnings')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/driver/withdraw-request', { amount: parseFloat(withdrawalAmount) })
      setWithdrawalAmount('')
      await fetchWithdrawals()
      await fetchEarnings()
      await fetchWallet()
      await fetchTransactions()
      alert('Withdrawal request submitted successfully')
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to submit withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async () => {
    try {
      const res = await axios.get('/api/driver/profile')
      setDriverProfile(res.data)
      // Only set available if driver is approved and verified
      if (res.data.verificationStatus === 'approved' && res.data.isVerified) {
        setIsAvailable(res.data.isAvailable)
      } else {
        setIsAvailable(false) // Force toggle off for pending/rejected drivers
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    }
  }

  useEffect(() => {
    fetchAvailability()
  }, [])

  const toggleAvailability = async () => {
    try {
      const res = await axios.put('/api/driver/availability')
      setIsAvailable(res.data.isAvailable)
    } catch (error) {
      console.error('Error toggling availability:', error)
    }
  }

  const acceptRide = async (rideId) => {
    setLoading(true)
    try {
      const res = await axios.put(`/api/driver/rides/${rideId}/accept`)
      setHasActiveRide(true)
      setIsAvailable(false)
      fetchPendingRides()
      fetchMyRides()
      fetchActiveRide() // Refresh active ride to show in active section
      alert('Ride accepted! Head to pickup location.')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to accept ride')
    } finally {
      setLoading(false)
    }
  }

  const declineRide = async (rideId) => {
    setLoading(true)
    try {
      await axios.put(`/api/driver/rides/${rideId}/decline`)
      // Remove from pending rides immediately
      setPendingRides(prev => prev.filter(r => r._id !== rideId))
      fetchPendingRides() // Refresh to ensure it's removed from backend
      alert('Ride declined.')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to decline ride')
    } finally {
      setLoading(false)
    }
  }

  const reachPickup = async (rideId) => {
    setLoading(true)
    try {
      await axios.put(`/api/driver/rides/${rideId}/reach-destination`)
      // Show OTP verification modal without auto-filling (driver enters manually)
      setOtpVerification({ show: true, rideId, otpCode: '' })
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark pickup location')
    } finally {
      setLoading(false)
    }
  }

  const reachDestination = async (rideId) => {
    try {
      const res = await axios.put(`/api/driver/rides/${rideId}/reach-destination`)
      // Show OTP verification modal without auto-filling
      setOtpVerification({ show: true, rideId, otpCode: '' })
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reach destination')
    }
  }

  const verifyOTP = async () => {
    if (!otpVerification.otpCode || otpVerification.otpCode.length !== 4) {
      alert('Please enter 4-digit OTP')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/otp/verify', {
        rideId: otpVerification.rideId,
        code: otpVerification.otpCode
      })
      setOtpVerification({ show: false, rideId: null, otpCode: '' })
      setHasActiveRide(true) // Driver now has an active ride
      fetchMyRides()
      fetchActiveRide() // Refresh active ride
      alert('OTP verified! Ride started.')
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const startRide = async (rideId) => {
    setLoading(true)
    try {
      await axios.put(`/api/driver/rides/${rideId}/start`)
      fetchMyRides()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start ride')
    } finally {
      setLoading(false)
    }
  }

  const completeRide = async (rideId) => {
    setLoading(true)
    try {
      const res = await axios.put(`/api/driver/rides/${rideId}/complete`)
      const completedRide = res.data
      
      // If payment method is cash, show payment collection modal
      if (completedRide.paymentMethod === 'cash' && completedRide.paymentStatus === 'pending') {
        setShowPaymentModal({ show: true, ride: completedRide })
      } else {
        setHasActiveRide(false)
        setActiveRide(null)
        setIsAvailable(true)
        await axios.put('/api/driver/availability')
        fetchMyRides()
        fetchEarnings()
        fetchPendingRides()
        fetchActiveRide()
        alert('Ride completed successfully!')
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to complete ride')
    } finally {
      setLoading(false)
    }
  }

  const collectPayment = async (rideId) => {
    setLoading(true)
    try {
      await axios.put(`/api/driver/rides/${rideId}/collect-payment`)
      setShowPaymentModal({ show: false, ride: null })
      setHasActiveRide(false)
      setActiveRide(null)
      setIsAvailable(true)
      await axios.put('/api/driver/availability')
      fetchMyRides()
      fetchEarnings()
      fetchPendingRides()
      fetchActiveRide()
      alert('Payment collected successfully!')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to collect payment')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
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

  return (
    <div className="min-h-screen bg-secondary">
      {showPaymentModal.show && showPaymentModal.ride && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-button p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Collect Payment</h3>
            <div className="mb-4">
              <p className="text-text-secondary mb-2">Payment Method: <span className="font-semibold text-text-primary capitalize">{showPaymentModal.ride.paymentMethod}</span></p>
              <p className="text-2xl font-bold text-accent">Collect ₹{showPaymentModal.ride.fare.toFixed(2)} from customer</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => collectPayment(showPaymentModal.ride._id)}
                disabled={loading}
                className="flex-1 bg-success text-text-light px-4 py-2 rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition"
              >
                Payment Collected
              </button>
              <button
                onClick={() => setShowPaymentModal({ show: false, ride: null })}
                disabled={loading}
                className="px-4 py-2 bg-surface border border-border text-text-primary rounded-button font-semibold hover:bg-secondary transition"
              >
                Not Collected
              </button>
            </div>
          </div>
        </div>
      )}
      
      {otpVerification.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-button p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Verify OTP</h3>
            <p className="text-text-secondary mb-4">Enter the OTP provided by the passenger to start the ride</p>
            <div className="mb-4">
              <div className="flex justify-center space-x-2 mb-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={otpVerification.otpCode[index] || ''}
                    onChange={(e) => {
                      const newOtpCode = otpVerification.otpCode.split('')
                      newOtpCode[index] = e.target.value.replace(/\D/g, '')
                      setOtpVerification({ ...otpVerification, otpCode: newOtpCode.join('') })
                      // Move focus to next input
                      if (e.target.value && index < 3) {
                        e.target.nextSibling?.focus()
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !e.target.value && index > 0) {
                        e.target.previousSibling?.focus()
                      }
                    }}
                    className="w-12 h-12 text-center text-2xl font-bold bg-surface border-2 border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-accent focus:outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <p className="text-xs text-text-secondary text-center">Enter the 4-digit OTP</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={verifyOTP}
                disabled={loading || otpVerification.otpCode.length !== 4}
                className="flex-1 bg-accent text-text-light px-4 py-2 rounded-button font-semibold hover:bg-accent-hover disabled:opacity-50 transition"
              >
                Verify & Start Ride
              </button>
              <button
                onClick={() => setOtpVerification({ show: false, rideId: null, otpCode: '' })}
                className="px-4 py-2 bg-surface border border-border text-text-primary rounded-button font-semibold hover:bg-secondary transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <nav className="bg-surface border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 py-2">
            <div className="flex items-center">
              <FaCar className="text-accent text-xl sm:text-2xl mr-2" />
              <span className="text-lg sm:text-xl font-bold text-text-primary">Ride Mitra - Driver</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-xs sm:text-sm text-text-secondary hidden sm:inline">Welcome, {user?.name}</span>
                <span className="text-xs text-text-secondary sm:hidden">{user?.name?.split(' ')[0]}</span>
                {driverProfile?.uniqueId && (
                  <span className="text-xs text-accent font-semibold">Driver ID: {driverProfile.uniqueId}</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-text-secondary hover:text-danger flex items-center space-x-1 text-sm sm:text-base px-2 sm:px-0"
              >
                <FaSignOutAlt className="text-sm sm:text-base" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Toggle Button and Wallet Below Navbar */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center sm:justify-start">
              {driverProfile && driverProfile.verificationStatus === 'pending' ? (
                <span className="px-3 py-1 bg-warning/20 text-warning text-sm font-semibold rounded-button">
                  Pending Verification
                </span>
              ) : (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!(isAvailable && driverProfile && driverProfile.verificationStatus === 'approved' && driverProfile.isVerified && !hasActiveRide)}
                    onChange={toggleAvailability}
                    disabled={!driverProfile || driverProfile.verificationStatus !== 'approved' || !driverProfile.isVerified || hasActiveRide}
                    className="sr-only peer"
                  />
                  <div className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                    (isAvailable && driverProfile && driverProfile.verificationStatus === 'approved' && driverProfile.isVerified && !hasActiveRide) ? 'bg-success' : 'bg-danger'
                  } ${(!driverProfile || driverProfile.verificationStatus !== 'approved' || !driverProfile.isVerified || hasActiveRide) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-6 w-6 transition-transform duration-200 ${
                      (isAvailable && driverProfile && driverProfile.verificationStatus === 'approved' && driverProfile.isVerified && !hasActiveRide) ? 'translate-x-7' : 'translate-x-0'
                    }`}></div>
                  </div>
                  <span className={`ml-2 sm:ml-3 text-xs sm:text-sm font-medium ${
                    (isAvailable && driverProfile && driverProfile.verificationStatus === 'approved' && driverProfile.isVerified && !hasActiveRide) ? 'text-success' : 'text-danger'
                  } ${(!driverProfile || driverProfile.verificationStatus !== 'approved' || !driverProfile.isVerified || hasActiveRide) ? 'opacity-50' : ''}`}>
                    {hasActiveRide ? 'On Ride' : (isAvailable && driverProfile && driverProfile.verificationStatus === 'approved' && driverProfile.isVerified) ? 'Available' : 'Busy'}
                  </span>
                </label>
              )}
            </div>
            <div className="flex items-center space-x-2 bg-accent/10 border border-accent/20 rounded-button px-3 py-2">
              <FaWallet className="text-accent text-sm sm:text-base" />
              <span className="text-xs sm:text-sm text-text-primary font-semibold">Wallet: ₹{wallet.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeRide && (
          <ActiveRideDriver 
            ride={activeRide} 
            onUpdate={fetchActiveRide}
            onReachPickup={reachPickup}
            onCompleteRide={completeRide}
            loading={loading}
          />
        )}
        
        {driverProfile && !driverProfile.licenseNumber && (
          <div className="bg-accent/10 border border-accent rounded-button p-6 mb-6">
            <div className="flex items-center space-x-3">
              <FaCar className="text-accent text-2xl" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-primary">Complete Your Registration</h3>
                <p className="text-text-secondary mb-4">Please complete your driver registration to start accepting rides.</p>
                <button
                  onClick={() => navigate('/driver/register')}
                  className="bg-accent text-text-light px-6 py-2 rounded-button font-semibold hover:bg-accent-hover transition"
                >
                  Complete Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {driverProfile && driverProfile.verificationStatus === 'pending' && driverProfile.licenseNumber && (
          <div className="bg-warning/10 border border-warning rounded-button p-6 mb-6">
            <div className="flex items-center space-x-3">
              <FaCheckCircle className="text-warning text-2xl" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-primary">Your Details Are Being Verified</h3>
                <p className="text-text-secondary mb-4">Your driver account is under review. You'll be able to accept rides once approved by admin.</p>
                {driverProfile.vkycStatus === 'completed' ? (
                  <div className="bg-success/10 border border-success text-success px-6 py-2 rounded-button font-semibold inline-flex items-center">
                    <FaCheckCircle className="mr-2" />
                    VKYC Completed
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/driver/vkyc-schedule')}
                    className="bg-accent text-text-light px-6 py-2 rounded-button font-semibold hover:bg-accent-hover transition flex items-center"
                  >
                    <FaVideo className="mr-2" />
                    Schedule VKYC Call
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {driverProfile && driverProfile.verificationStatus === 'rejected' && (
          <div className="bg-danger/10 border border-danger rounded-button p-6 mb-6">
            <div className="flex items-center space-x-3">
              <FaExclamationTriangle className="text-danger text-2xl" />
              <div>
                <h3 className="text-lg font-bold text-text-primary">Account Rejected</h3>
                <p className="text-text-secondary mb-2">{driverProfile.rejectionReason || 'Your driver account has been rejected. Please contact admin for more information.'}</p>
                <button
                  onClick={() => navigate('/driver/register')}
                  className="bg-accent text-text-light px-6 py-2 rounded-button font-semibold hover:bg-accent-hover transition mt-2"
                >
                  Update Details & Resubmit
                </button>
              </div>
            </div>
          </div>
        )}
        
        {driverProfile && driverProfile.verificationStatus === 'approved' && driverProfile.isVerified && (!driverProfile.vehicleType || !driverProfile.vehicleNumber) && (
          <div className="mb-6">
            <VehicleDetailsForm onSuccess={() => {
              fetchAvailability()
              fetchPendingRides()
            }} />
          </div>
        )}

        <div className="bg-surface border border-border rounded-button shadow-md overflow-hidden">
          <div className="border-b border-border overflow-x-auto">
            <nav className="flex -mb-px min-w-max sm:min-w-0">
              <button
                onClick={() => {
                  setActiveTab('pending')
                  localStorage.setItem('driverActiveTab', 'pending')
                }}
                className={`py-3 sm:py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <span className="hidden sm:inline">Pending Rides</span>
                <span className="sm:hidden">Pending</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('myRides')
                  localStorage.setItem('driverActiveTab', 'myRides')
                }}
                className={`py-3 sm:py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                  activeTab === 'myRides'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-secondary hover:border-border'
                }`}
              >
                <FaHistory className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">My Rides</span>
                <span className="sm:hidden">Rides</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('earnings')
                  localStorage.setItem('driverActiveTab', 'earnings')
                }}
                className={`py-3 sm:py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                  activeTab === 'earnings'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-secondary hover:border-border'
                }`}
              >
                <FaRupeeSign className="inline mr-1 sm:mr-2" />
                Earnings
              </button>
              <button
                onClick={() => {
                  setActiveTab('transactions')
                  localStorage.setItem('driverActiveTab', 'transactions')
                }}
                className={`py-3 sm:py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-secondary hover:border-border'
                }`}
              >
                <FaExchangeAlt className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Transactions</span>
                <span className="sm:hidden">Transactions</span>
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'pending' && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Pending Rides</h2>
                  {pendingRides.length > 0 && (
                    <span className="px-2 sm:px-3 py-1 bg-accent/20 text-accent rounded-full text-xs sm:text-sm font-semibold">
                      {pendingRides.length} {pendingRides.length === 1 ? 'Ride' : 'Rides'} Available
                    </span>
                  )}
                </div>
                {pendingRides.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <FaCar className="text-4xl mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No pending rides available</p>
                    <p className="text-sm mt-2">New bookings will appear here automatically</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {pendingRides.map((ride) => {
                      const bookingTime = new Date(ride.bookingTime)
                      const timeAgo = Math.floor((Date.now() - bookingTime.getTime()) / 1000)
                      const minutesAgo = Math.floor(timeAgo / 60)
                      const secondsAgo = timeAgo % 60
                      
                      return (
                        <div key={ride._id} className="bg-surface border-2 border-accent/30 rounded-button p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all">
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent rounded-full"></div>
                              <span className="text-xs font-semibold text-accent uppercase">New Booking</span>
                            </div>
                            <div className="text-xs text-text-secondary">
                              {minutesAgo > 0 ? `${minutesAgo}m ${secondsAgo}s ago` : `${secondsAgo}s ago`}
                            </div>
                          </div>
                          
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-start">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/20 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <FaMapMarkerAlt className="text-accent text-sm sm:text-lg" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Pickup Location</div>
                                <div className="text-text-primary font-semibold text-sm sm:text-base break-words">{ride.pickupLocation.address}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-secondary/20 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <FaMapMarkerAlt className="text-accent-secondary text-sm sm:text-lg" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Dropoff Location</div>
                                <div className="text-text-primary font-semibold text-sm sm:text-base break-words">{ride.dropoffLocation.address}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                              <div className="bg-secondary/50 rounded-button p-2 sm:p-3">
                                <div className="text-xs text-text-secondary mb-1">Distance</div>
                                <div className="text-text-primary font-bold text-sm sm:text-lg">{ride.distance} km</div>
                              </div>
                              <div className="bg-accent/10 rounded-button p-2 sm:p-3">
                                <div className="text-xs text-text-secondary mb-1">Fare</div>
                                <div className="text-accent text-lg sm:text-xl font-bold">₹{ride.fare}</div>
                              </div>
                              <div className="bg-secondary/50 rounded-button p-2 sm:p-3">
                                <div className="text-xs text-text-secondary mb-1">Vehicle</div>
                                <div className="text-text-primary font-semibold capitalize text-sm sm:text-base">{ride.vehicleType}</div>
                              </div>
                            </div>
                            
                            {ride.rideType && (
                              <div className="bg-accent/10 rounded-button p-2 sm:p-3 mt-2">
                                <div className="text-xs text-text-secondary mb-1">Ride Type</div>
                                <div className="text-accent font-semibold capitalize text-sm sm:text-base">{ride.rideType}</div>
                              </div>
                            )}
                            
                            <div className="bg-secondary/30 rounded-button p-2 sm:p-3">
                              <div className="text-xs text-text-secondary mb-1">Passenger Details</div>
                              <div className="text-text-primary font-medium text-sm sm:text-base">
                                {ride.userId?.name || 'Unknown'} | {ride.userId?.phone ? (() => {
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
                            
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                              <button
                                onClick={() => acceptRide(ride._id)}
                                disabled={loading || !isAvailable || hasActiveRide}
                                className="flex-1 bg-accent text-text-light px-4 sm:px-6 py-2 sm:py-3 rounded-button font-bold text-sm sm:text-base hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105 active:scale-95 shadow-lg"
                              >
                                ✓ Accept Ride
                              </button>
                              <button
                                onClick={() => declineRide(ride._id)}
                                disabled={loading}
                                className="flex-1 bg-surface border-2 border-border text-text-primary px-4 sm:px-6 py-2 sm:py-3 rounded-button font-semibold hover:bg-secondary disabled:opacity-50 transition text-sm sm:text-base"
                              >
                                ✕ Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'myRides' && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">My Rides</h2>
                {myRides.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-text-secondary">
                    <p>No rides yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {myRides.map((ride) => (
                      <div key={ride._id} className="bg-surface rounded-lg p-4 sm:p-6 border border-border">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                          <div className="flex-1 w-full sm:w-auto">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ride.status)}`}>
                              {ride.status.toUpperCase()}
                            </span>
                            <div className="mt-2 space-y-1">
                              <div className="text-xs sm:text-sm text-text-secondary break-words">From: {ride.pickupLocation.address}</div>
                              <div className="text-xs sm:text-sm text-text-secondary break-words">To: {ride.dropoffLocation.address}</div>
                            </div>
                            <div className="text-xs sm:text-sm text-text-secondary mt-2">
                              Passenger: {ride.userId?.name} | {ride.userId?.phone ? (() => {
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
                            {ride.rideId && (
                              <div className="text-xs text-text-secondary mt-1">
                                Ride ID: <span className="font-semibold text-accent">{ride.rideId}</span>
                              </div>
                            )}
                            {ride.paymentMethod && (
                              <div className="text-xs text-text-secondary mt-1">
                                Payment: <span className="font-semibold capitalize text-accent">{ride.paymentMethod === 'wallet' || ride.paymentMethod === 'prepaid' ? 'Wallet' : ride.paymentMethod === 'online' || ride.paymentMethod === 'card' ? 'Online' : 'Cash'}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-bold text-accent">₹{ride.fare}</div>
                            <div className="text-xs sm:text-sm text-text-secondary">{ride.distance} km</div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                          {ride.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRide(ride)
                                  setShowMapView(true)
                                }}
                                className="flex-1 bg-accent text-text-light px-4 py-2 rounded-button font-semibold hover:bg-accent-hover transition flex items-center justify-center text-sm sm:text-base"
                              >
                                <FaMap className="mr-2" />
                                View on Map
                              </button>
                              <button
                                onClick={() => reachPickup(ride._id)}
                                disabled={loading}
                                className="flex-1 bg-success text-text-light px-4 py-2 rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition text-sm sm:text-base"
                              >
                                Mark Reached Pickup
                              </button>
                            </>
                          )}
                          {ride.status === 'in-progress' && (
                            <button
                              onClick={() => completeRide(ride._id)}
                              disabled={loading}
                              className="w-full bg-success text-text-light px-4 py-2 rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition text-sm sm:text-base"
                            >
                              Complete Ride
                            </button>
                          )}
                          {ride.status === 'completed' && ride.paymentMethod === 'cash' && ride.paymentStatus === 'pending' && (
                            <div className="w-full bg-warning/10 border border-warning rounded-button p-4">
                              <p className="text-text-primary font-semibold mb-2 text-sm sm:text-base">Collect ₹{ride.fare.toFixed(2)} from customer</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => collectPayment(ride._id)}
                                  disabled={loading}
                                  className="flex-1 bg-success text-text-light px-4 py-2 rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition text-sm sm:text-base"
                                >
                                  Payment Collected
                                </button>
                                <button
                                  onClick={() => setShowPaymentModal({ show: true, ride })}
                                  disabled={loading}
                                  className="px-4 py-2 bg-surface border border-border text-text-primary rounded-button font-semibold hover:bg-secondary transition text-sm sm:text-base"
                                >
                                  Not Collected
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {showMapView && selectedRide && (
                          <MapView
                            pickupLocation={selectedRide.pickupLocation}
                            dropoffLocation={selectedRide.dropoffLocation}
                            onClose={() => {
                              setShowMapView(false)
                              setSelectedRide(null)
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && earnings && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">Earnings</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                  <div className="bg-accent/10 border border-accent/20 rounded-button p-4 sm:p-6">
                    <div className="text-xs sm:text-sm text-text-secondary mb-1 sm:mb-2">Total Earnings</div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-accent">₹{earnings.totalEarnings?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div className="bg-success/10 border border-success/20 rounded-button p-4 sm:p-6">
                    <div className="text-xs sm:text-sm text-text-secondary mb-1 sm:mb-2">Today</div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-success">₹{earnings.todayEarnings?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div className="bg-accent/10 border border-accent/20 rounded-button p-4 sm:p-6">
                    <div className="text-xs sm:text-sm text-text-secondary mb-1 sm:mb-2">This Month</div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-accent">₹{earnings.monthlyEarnings?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div className="bg-warning/10 border border-warning/20 rounded-button p-4 sm:p-6">
                    <div className="text-xs sm:text-sm text-text-secondary mb-1 sm:mb-2">Total Rides</div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-warning">{earnings.totalRides}</div>
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-button p-6 mb-6">
                  <div className="flex items-center space-x-2">
                    <FaStar className="text-yellow-400 text-2xl" />
                    <div>
                      <div className="text-sm text-text-secondary">Average Rating</div>
                      <div className="text-2xl font-bold">{earnings.rating || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Account Details Section */}
                <div className="bg-surface border border-border rounded-button p-6 mb-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Account Details</h3>
                  {!accountDetails ? (
                    <div>
                      {!showAccountForm ? (
                        <div className="space-y-4">
                          <div className="bg-warning/10 border border-warning/20 rounded-button p-4">
                            <p className="text-sm text-text-secondary mb-3">
                              Add your bank account details to enable withdrawal of your earnings. This information is required to process withdrawal requests.
                            </p>
                            <button
                              onClick={() => setShowAccountForm(true)}
                              className="bg-accent text-text-light px-6 py-3 rounded-button font-semibold hover:bg-accent-hover transition flex items-center justify-center w-full sm:w-auto"
                            >
                              <FaWallet className="mr-2" />
                              Add Account Details
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={saveAccountDetails} className="space-y-4">
                          <div className="bg-accent/10 border border-accent/20 rounded-button p-4 mb-4">
                            <p className="text-sm text-text-secondary">
                              <strong className="text-text-primary">Note:</strong> You can only edit account details once. Please ensure all information is correct before saving.
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              Account Number <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              value={accountForm.accountNumber}
                              onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                              className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                              required
                              placeholder="Enter account number"
                              maxLength="18"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              Confirm Account Number <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              value={accountForm.confirmAccountNumber}
                              onChange={(e) => setAccountForm({ ...accountForm, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                              className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                              required
                              placeholder="Re-enter account number"
                              maxLength="18"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              IFSC Code <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              value={accountForm.ifscCode}
                              onChange={(e) => setAccountForm({ ...accountForm, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                              className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent uppercase"
                              required
                              placeholder="e.g., HDFC0001234"
                              maxLength="11"
                            />
                            <p className="text-xs text-text-secondary mt-1">Format: 4 letters + 0 + 6 digits (e.g., HDFC0001234)</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              Account Holder Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              value={accountForm.accountHolderName}
                              onChange={(e) => setAccountForm({ ...accountForm, accountHolderName: e.target.value })}
                              className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                              required
                              placeholder="Enter account holder name as per bank records"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 bg-accent text-text-light px-6 py-3 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50 flex items-center justify-center"
                            >
                              {loading ? 'Saving...' : (
                                <>
                                  <FaWallet className="mr-2" />
                                  Save Account Details
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAccountForm(false)
                                setAccountForm({ accountNumber: '', confirmAccountNumber: '', ifscCode: '', accountHolderName: '' })
                              }}
                              className="bg-surface border border-border text-text-primary px-6 py-3 rounded-button font-semibold hover:bg-secondary transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : showAccountForm && !accountDetails.isEdited ? (
                    <form onSubmit={saveAccountDetails} className="space-y-4">
                      <div className="bg-accent/10 border border-accent/20 rounded-button p-4 mb-4">
                        <p className="text-sm text-text-secondary">
                          <strong className="text-text-primary">Note:</strong> You can only edit account details once. Please ensure all information is correct before saving.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Account Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountForm.accountNumber}
                          onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                          placeholder="Enter account number"
                          maxLength="18"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Confirm Account Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountForm.confirmAccountNumber}
                          onChange={(e) => setAccountForm({ ...accountForm, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                          placeholder="Re-enter account number"
                          maxLength="18"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          IFSC Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountForm.ifscCode}
                          onChange={(e) => setAccountForm({ ...accountForm, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent uppercase"
                          required
                          placeholder="e.g., HDFC0001234"
                          maxLength="11"
                        />
                        <p className="text-xs text-text-secondary mt-1">Format: 4 letters + 0 + 6 digits (e.g., HDFC0001234)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Account Holder Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountForm.accountHolderName}
                          onChange={(e) => setAccountForm({ ...accountForm, accountHolderName: e.target.value })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                          placeholder="Enter account holder name as per bank records"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-accent text-text-light px-6 py-3 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50 flex items-center justify-center"
                        >
                          {loading ? 'Saving...' : (
                            <>
                              <FaWallet className="mr-2" />
                              Update Account Details
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountForm(false)
                            setAccountForm({ accountNumber: '', confirmAccountNumber: '', ifscCode: '', accountHolderName: '' })
                          }}
                          className="bg-surface border border-border text-text-primary px-6 py-3 rounded-button font-semibold hover:bg-secondary transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <div><span className="text-text-secondary">Account Number:</span> <span className="text-text-primary font-semibold">{accountDetails.accountNumber}</span></div>
                      <div><span className="text-text-secondary">IFSC Code:</span> <span className="text-text-primary font-semibold">{accountDetails.ifscCode}</span></div>
                      <div><span className="text-text-secondary">Account Holder:</span> <span className="text-text-primary font-semibold">{accountDetails.accountHolderName}</span></div>
                      {accountDetails.isEdited ? (
                        <div className="mt-4 p-3 bg-warning/10 border border-warning rounded-button">
                          <p className="text-sm text-text-secondary">
                            Account details can only be edited once. Please contact admin for any changes.
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setShowAccountForm(true)
                            setAccountForm({
                              accountNumber: accountDetails.accountNumber,
                              confirmAccountNumber: accountDetails.accountNumber,
                              ifscCode: accountDetails.ifscCode,
                              accountHolderName: accountDetails.accountHolderName
                            })
                          }}
                          className="mt-4 bg-accent/10 border border-accent text-accent px-4 py-2 rounded-button font-semibold hover:bg-accent/20 transition"
                        >
                          Update Account Details
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Withdrawal Request Section */}
                {accountDetails && (
                  <div className="bg-surface border border-border rounded-button p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Request Withdrawal</h3>
                    <form onSubmit={requestWithdrawal} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Amount (₹)</label>
                        <input
                          type="number"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                          min="1"
                          step="0.01"
                          max={earnings?.totalEarnings || 0}
                          placeholder={`Max: ₹${earnings?.totalEarnings?.toFixed(2) || '0.00'}`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                        className="bg-accent text-text-light px-6 py-2 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50"
                      >
                        Request Withdrawal
                      </button>
                    </form>

                    {/* Withdrawal History */}
                    {withdrawals.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-bold text-text-primary mb-3">Withdrawal History</h4>
                        <div className="space-y-2">
                          {withdrawals.map((withdrawal) => (
                            <div key={withdrawal._id} className="bg-secondary border border-border rounded-button p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-text-primary">₹{withdrawal.amount.toFixed(2)}</div>
                                  {withdrawal.transactionId && (
                                    <div className="text-xs text-text-secondary">Transaction ID: {withdrawal.transactionId}</div>
                                  )}
                                  {withdrawal.utrNumber && (
                                    <div className="text-xs text-accent font-semibold mt-1">UTR Number: {withdrawal.utrNumber}</div>
                                  )}
                                  <div className="text-xs text-text-secondary mt-1">{new Date(withdrawal.requestedAt).toLocaleString()}</div>
                                  {withdrawal.processedAt && (
                                    <div className="text-xs text-text-secondary">Processed: {new Date(withdrawal.processedAt).toLocaleString()}</div>
                                  )}
                                  {withdrawal.adminRemark && (
                                    <div className="text-xs text-text-secondary mt-1">Remark: {withdrawal.adminRemark}</div>
                                  )}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  withdrawal.status === 'completed' ? 'bg-success/20 text-success' :
                                  withdrawal.status === 'rejected' ? 'bg-danger/20 text-danger' :
                                  'bg-warning/20 text-warning'
                                }`}>
                                  {withdrawal.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">Transaction History</h2>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction._id} className="bg-secondary border border-border rounded-button p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                transaction.type === 'credit' 
                                  ? 'bg-success/20 text-success' 
                                  : 'bg-danger/20 text-danger'
                              }`}>
                                {transaction.type.toUpperCase()}
                              </span>
                              <span className="text-sm text-text-secondary">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-text-primary font-medium">{transaction.description}</div>
                            {transaction.description?.includes('Withdrawal') && transaction.description?.includes('TXN') && (
                              <div className="text-xs text-text-secondary mt-1">
                                {transaction.description.split(' - ')[1]}
                              </div>
                            )}
                            {transaction.rideId && !transaction.description?.includes('Withdrawal') && (
                              <div className="text-xs text-text-secondary mt-1">
                                Ride ID: {transaction.rideId.rideId || transaction.rideId._id}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              transaction.type === 'credit' ? 'text-success' : 'text-danger'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-text-secondary mt-1">
                              Balance: ₹{transaction.balanceAfter.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard

