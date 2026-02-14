import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaUsers, FaCar, FaSignOutAlt, FaCheckCircle, FaTimesCircle, FaTrash, FaChartBar, FaEdit, FaSave, FaTimes, FaTag, FaSearch, FaMapMarkerAlt, FaClock, FaRupeeSign, FaVideo, FaWallet, FaExchangeAlt, FaUniversity, FaHistory } from 'react-icons/fa'
import VideoCall from '../components/admin/VideoCall'
import { API_URL } from '../config'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on mount
    return localStorage.getItem('adminActiveTab') || 'stats'
  })
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [drivers, setDrivers] = useState([])
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [imagePopup, setImagePopup] = useState({ show: false, src: '', title: '' })
  const [coupons, setCoupons] = useState([])
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: null,
    validUntil: '',
    usageLimit: null
  })
  const [searchRideId, setSearchRideId] = useState('')
  const [searchedRide, setSearchedRide] = useState(null)
  const [videoCall, setVideoCall] = useState({ show: false, driverId: null, driverName: '' })
  const [walletForm, setWalletForm] = useState({ userId: '', driverId: '', amount: '', type: 'user', remark: '' })
  const [userFilter, setUserFilter] = useState('')
  const [driverFilter, setDriverFilter] = useState({ status: 'all', search: '' })
  const [rideFilter, setRideFilter] = useState({ status: 'all', search: '' })
  const [withdrawals, setWithdrawals] = useState([])
  const [withdrawalRemark, setWithdrawalRemark] = useState('')
  const [editingAccountDetails, setEditingAccountDetails] = useState(null)
  const [accountDetailsForm, setAccountDetailsForm] = useState({ accountNumber: '', ifscCode: '', accountHolderName: '' })
  const [withdrawalFilter, setWithdrawalFilter] = useState({ status: 'all', search: '' })
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [driverSearchQuery, setDriverSearchQuery] = useState('')
  const [transactions, setTransactions] = useState([])
  const [transactionFilter, setTransactionFilter] = useState({ type: 'all', role: 'all', search: '', dateFrom: '', dateTo: '' })

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'drivers') {
      fetchDrivers()
    } else if (activeTab === 'rides') {
      fetchRides()
    } else if (activeTab === 'coupons') {
      fetchCoupons()
    } else if (activeTab === 'wallet') {
      fetchUsers()
      fetchDrivers()
    } else if (activeTab === 'walletToAccount') {
      fetchWithdrawals()
    } else if (activeTab === 'transactions') {
      fetchTransactions()
    }
  }, [activeTab])

  const fetchCoupons = async () => {
    try {
      const res = await axios.get('/api/admin/coupons')
      setCoupons(res.data)
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
  }

  const createCoupon = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/admin/coupons', newCoupon)
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minAmount: 0,
        maxDiscount: null,
        validUntil: '',
        usageLimit: null
      })
      fetchCoupons()
      alert('Coupon created successfully!')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create coupon')
    } finally {
      setLoading(false)
    }
  }

  const deleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return
    setLoading(true)
    try {
      await axios.delete(`/api/admin/coupons/${couponId}`)
      fetchCoupons()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete coupon')
    } finally {
      setLoading(false)
    }
  }

  const searchRide = async () => {
    if (!searchRideId.trim()) {
      alert('Please enter a ride ID')
      return
    }
    setLoading(true)
    try {
      const res = await axios.get(`/api/admin/rides/search/${searchRideId.trim()}`)
      setSearchedRide(res.data)
    } catch (error) {
      alert(error.response?.data?.message || 'Ride not found')
      setSearchedRide(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats')
      setStats(res.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users')
      setUsers(res.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchDrivers = async () => {
    try {
      const res = await axios.get('/api/admin/drivers')
      setDrivers(res.data)
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const fetchRides = async () => {
    try {
      const res = await axios.get('/api/admin/rides')
      setRides(res.data)
    } catch (error) {
      console.error('Error fetching rides:', error)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get('/api/admin/withdrawals')
      setWithdrawals(res.data || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/admin/transactions')
      setTransactions(res.data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const approveWithdrawal = async (withdrawalId, utrNumber, adminRemark) => {
    if (!utrNumber || utrNumber.trim() === '') {
      alert('Please enter UTR number')
      return
    }
    setLoading(true)
    try {
      await axios.put(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        utrNumber: utrNumber.trim(),
        adminRemark: adminRemark || undefined
      })
      await fetchWithdrawals()
      await fetchDrivers()
      alert('Withdrawal approved successfully')
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to approve withdrawal')
    } finally {
      setLoading(false)
    }
  }

  const rejectWithdrawal = async (withdrawalId) => {
    const remark = prompt('Enter rejection reason (optional):')
    setLoading(true)
    try {
      await axios.put(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        adminRemark: remark || undefined
      })
      await fetchWithdrawals()
      alert('Withdrawal rejected')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject withdrawal')
    } finally {
      setLoading(false)
    }
  }

  const approveDriver = async (driverId) => {
    try {
      setLoading(true)
      await axios.put(`/api/admin/drivers/${driverId}/approve`)
      await fetchDrivers()
      await fetchStats()
    } catch (error) {
      console.error('Error approving driver:', error)
      alert('Failed to approve driver')
    } finally {
      setLoading(false)
    }
  }

  const rejectDriver = async (driverId, reason) => {
    try {
      setLoading(true)
      await axios.put(`/api/admin/drivers/${driverId}/reject`, { rejectionReason: reason })
      await fetchDrivers()
      await fetchStats()
    } catch (error) {
      console.error('Error rejecting driver:', error)
      alert('Failed to reject driver')
    } finally {
      setLoading(false)
    }
  }

  const verifyDriver = async (driverId) => {
    setLoading(true)
    try {
      await axios.put(`/api/admin/drivers/${driverId}/verify`)
      fetchDrivers()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify driver')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    setLoading(true)
    try {
      await axios.delete(`/api/admin/users/${userId}`)
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const deleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver? They will need to register again.')) return
    setLoading(true)
    try {
      await axios.delete(`/api/admin/drivers/${driverId}`)
      fetchDrivers()
      await fetchStats()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete driver')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (driver) => {
    setEditingDriver(driver._id)
    setEditFormData({
      aadharNumber: driver.aadharNumber || '',
      panNumber: driver.panNumber || ''
    })
  }

  const cancelEditing = () => {
    setEditingDriver(null)
    setEditFormData({})
  }

  const saveDriverDetails = async (driverId) => {
    setLoading(true)
    try {
      await axios.put(`/api/admin/drivers/${driverId}/update-details`, editFormData)
      await fetchDrivers()
      setEditingDriver(null)
      setEditFormData({})
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update driver details')
    } finally {
      setLoading(false)
    }
  }

  const openImagePopup = (src, title) => {
    setImagePopup({ show: true, src, title })
  }

  const closeImagePopup = () => {
    setImagePopup({ show: false, src: '', title: '' })
  }

  const handleStartVKYC = async (driverId, driverName) => {
    try {
      setLoading(true)
      await axios.post(`/api/admin/drivers/${driverId}/vkyc/start`)
      setVideoCall({ show: true, driverId, driverName })
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start VKYC call')
    } finally {
      setLoading(false)
    }
  }

  const handleCaptureScreen = async (blob, documentType) => {
    if (!videoCall.driverId) return
    
    try {
      const formData = new FormData()
      formData.append('image', blob, `vkyc-${documentType}.png`)
      formData.append('documentType', documentType)
      
      await axios.post(`/api/admin/drivers/${videoCall.driverId}/vkyc/capture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Don't show alert for each capture, only show success message
      console.log(`${documentType} captured successfully`)
      await fetchDrivers() // Refresh to show new capture
    } catch (error) {
      alert(error.response?.data?.message || `Failed to capture ${documentType}`)
    }
  }

  const handleEndVKYC = async () => {
    if (!videoCall.driverId) return
    
    try {
      await axios.put(`/api/admin/drivers/${videoCall.driverId}/vkyc/complete`)
      setVideoCall({ show: false, driverId: null, driverName: '' })
      await fetchDrivers()
      alert('VKYC call completed successfully')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to complete VKYC call')
    }
  }

  const handleUpdateAccountDetails = async (driverId) => {
    if (!accountDetailsForm.accountNumber || !accountDetailsForm.ifscCode || !accountDetailsForm.accountHolderName) {
      alert('Please fill all fields')
      return
    }
    setLoading(true)
    try {
      await axios.put(`/api/admin/drivers/${driverId}/account-details`, accountDetailsForm)
      await fetchDrivers()
      setEditingAccountDetails(null)
      setAccountDetailsForm({ accountNumber: '', ifscCode: '', accountHolderName: '' })
      alert('Account details updated successfully')
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to update account details')
    } finally {
      setLoading(false)
    }
  }

  const startEditingAccountDetails = (driver) => {
    setEditingAccountDetails(driver._id)
    setAccountDetailsForm({
      accountNumber: driver.accountDetails?.accountNumber || '',
      ifscCode: driver.accountDetails?.ifscCode || '',
      accountHolderName: driver.accountDetails?.accountHolderName || ''
    })
  }

  const cancelEditingAccountDetails = () => {
    setEditingAccountDetails(null)
    setAccountDetailsForm({ accountNumber: '', ifscCode: '', accountHolderName: '' })
  }

  const handleAddWallet = async (e) => {
    e.preventDefault()
    if (!walletForm.amount || parseFloat(walletForm.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      if (walletForm.type === 'user') {
        if (!walletForm.userId) {
          alert('Please select a user')
          return
        }
        await axios.post(`/api/admin/users/${walletForm.userId}/wallet`, {
          amount: parseFloat(walletForm.amount),
          remark: walletForm.remark || undefined
        })
        alert('Amount added to user wallet successfully')
        await fetchUsers()
      } else {
        if (!walletForm.driverId) {
          alert('Please select a driver')
          return
        }
        await axios.post(`/api/admin/drivers/${walletForm.driverId}/wallet`, {
          amount: parseFloat(walletForm.amount),
          remark: walletForm.remark || undefined
        })
        alert('Amount added to driver wallet successfully')
        await fetchDrivers()
      }
      setWalletForm({ userId: '', driverId: '', amount: '', type: 'user', remark: '' })
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add wallet amount')
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
      {/* Video Call Component */}
      {videoCall.show && (
        <VideoCall
          driverId={videoCall.driverId}
          driverName={videoCall.driverName}
          onCapture={handleCaptureScreen}
          onClose={handleEndVKYC}
        />
      )}

      {/* Image Popup Modal */}
      {imagePopup.show && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={closeImagePopup}
        >
          <div className="relative max-w-4xl w-full bg-surface rounded-button p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeImagePopup}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary bg-surface border border-border rounded-full w-8 h-8 flex items-center justify-center transition"
            >
              <FaTimes />
            </button>
            <h3 className="text-xl font-bold text-text-primary mb-4">{imagePopup.title}</h3>
            <img 
              src={imagePopup.src} 
              alt={imagePopup.title}
              className="w-full h-auto rounded-button max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
      <nav className="bg-surface border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FaChartBar className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold text-text-primary">Ride Mitra - Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-text-secondary">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-text-secondary hover:text-danger flex items-center space-x-1"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-surface border border-border rounded-button shadow-md">
          <div className="border-b border-border">
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  setActiveTab('stats')
                  localStorage.setItem('adminActiveTab', 'stats')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition ${
                  activeTab === 'stats'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaChartBar className="inline mr-2" />
                Statistics
              </button>
              <button
                onClick={() => {
                  setActiveTab('users')
                  localStorage.setItem('adminActiveTab', 'users')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaUsers className="inline mr-2" />
                Manage Users
              </button>
              <button
                onClick={() => {
                  setActiveTab('drivers')
                  localStorage.setItem('adminActiveTab', 'drivers')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'drivers'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaCar className="inline mr-2" />
                Manage Drivers
              </button>
              <button
                onClick={() => {
                  setActiveTab('rides')
                  localStorage.setItem('adminActiveTab', 'rides')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'rides'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                All Rides
              </button>
              <button
                onClick={() => {
                  setActiveTab('coupons')
                  localStorage.setItem('adminActiveTab', 'coupons')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'coupons'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaTag className="inline mr-2" />
                Coupons
              </button>
              <button
                onClick={() => {
                  setActiveTab('help')
                  localStorage.setItem('adminActiveTab', 'help')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'help'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaSearch className="inline mr-2" />
                Help
              </button>
              <button
                onClick={() => {
                  setActiveTab('wallet')
                  localStorage.setItem('adminActiveTab', 'wallet')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'wallet'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaWallet className="inline mr-2" />
                Wallet
              </button>
              <button
                onClick={() => {
                  setActiveTab('walletToAccount')
                  localStorage.setItem('adminActiveTab', 'walletToAccount')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'walletToAccount'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaUniversity className="inline mr-2" />
                Wallet to Account
              </button>
              <button
                onClick={() => {
                  setActiveTab('transactions')
                  localStorage.setItem('adminActiveTab', 'transactions')
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaHistory className="inline mr-2" />
                Transactions
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'stats' && stats && (
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">Dashboard Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-accent/10 border border-accent/20 rounded-button p-6">
                    <div className="text-sm text-text-secondary mb-2">Total Users</div>
                    <div className="text-3xl font-bold text-accent">{stats.totalUsers}</div>
                  </div>
                  <div className="bg-success/10 border border-success/20 rounded-button p-6">
                    <div className="text-sm text-text-secondary mb-2">Total Drivers</div>
                    <div className="text-3xl font-bold text-success">{stats.totalDrivers}</div>
                    <div className="text-sm text-text-secondary mt-1">Verified: {stats.verifiedDrivers}</div>
                  </div>
                  <div className="bg-warning/10 border border-warning/20 rounded-button p-6">
                    <div className="text-sm text-text-secondary mb-2">Total Rides</div>
                    <div className="text-3xl font-bold text-warning">{stats.totalRides}</div>
                    <div className="text-sm text-text-secondary mt-1">Today: {stats.todayRides}</div>
                  </div>
                  <div className="bg-accent/10 border border-accent/20 rounded-button p-6">
                    <div className="text-sm text-text-secondary mb-2">Total Revenue</div>
                    <div className="text-3xl font-bold text-accent">₹{stats.totalRevenue}</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface rounded-button p-6 border border-border">
                    <div className="text-sm text-text-secondary mb-2">Completed Rides</div>
                    <div className="text-2xl font-bold text-success">{stats.completedRides}</div>
                  </div>
                  <div className="bg-surface rounded-button p-6 border border-border">
                    <div className="text-sm text-text-secondary mb-2">Pending Rides</div>
                    <div className="text-2xl font-bold text-warning">{stats.pendingRides}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-text-primary">Manage Users</h2>
                  <div className="w-full sm:w-auto">
                    <input
                      type="text"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      placeholder="Search by User ID, name, email, or phone..."
                      className="w-full sm:w-64 px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-divider">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Wallet</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border">
                      {users
                        .filter((u) => {
                          if (!userFilter) return true
                          const search = userFilter.toLowerCase()
                          return (
                            u.name?.toLowerCase().includes(search) ||
                            u.email?.toLowerCase().includes(search) ||
                            u.phone?.toLowerCase().includes(search) ||
                            u.uniqueId?.toLowerCase().includes(search) ||
                            u._id?.toString().includes(search)
                          )
                        })
                        .map((u) => (
                        <tr key={u._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-accent font-semibold">{u.uniqueId || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{u.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{u.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-accent font-semibold">₹{u.wallet?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => deleteUser(u._id)}
                              disabled={loading}
                              className="text-danger hover:text-red-400"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.filter((u) => {
                    if (!userFilter) return true
                    const search = userFilter.toLowerCase()
                    return (
                      u.name?.toLowerCase().includes(search) ||
                      u.email?.toLowerCase().includes(search) ||
                      u.phone?.toLowerCase().includes(search)
                    )
                  }).length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                      No users found matching your search
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'drivers' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-text-primary">Manage Drivers</h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <select
                      value={driverFilter.status}
                      onChange={(e) => setDriverFilter({ ...driverFilter, status: e.target.value })}
                      className="px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <input
                      type="text"
                      value={driverFilter.search}
                      onChange={(e) => setDriverFilter({ ...driverFilter, search: e.target.value })}
                      placeholder="Search by Driver ID, name, email, phone..."
                      className="px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent w-full sm:w-64"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {drivers
                    .filter((driver) => {
                      if (driverFilter.status !== 'all' && driver.verificationStatus !== driverFilter.status) {
                        return false
                      }
                      if (!driverFilter.search) return true
                      const search = driverFilter.search.toLowerCase()
                      return (
                        driver.userId?.name?.toLowerCase().includes(search) ||
                        driver.userId?.email?.toLowerCase().includes(search) ||
                        driver.userId?.phone?.toLowerCase().includes(search) ||
                        driver.vehicleNumber?.toLowerCase().includes(search) ||
                        driver.licenseNumber?.toLowerCase().includes(search) ||
                        driver.uniqueId?.toLowerCase().includes(search) ||
                        driver._id?.toString().includes(search)
                      )
                    })
                    .map((driver) => (
                    <div key={driver._id} className="bg-surface rounded-button p-6 border border-border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-4">
                            {driver.profileImage && (
                              <img 
                                src={`${API_URL}${driver.profileImage}`} 
                                alt="Profile" 
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold">{driver.userId?.name}</h3>
                              {driver.uniqueId && (
                                <div className="text-xs text-accent font-semibold mb-1">Driver ID: {driver.uniqueId}</div>
                              )}
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                driver.verificationStatus === 'approved' 
                                  ? 'bg-success/20 text-success' 
                                  : driver.verificationStatus === 'rejected'
                                  ? 'bg-danger/20 text-danger'
                                  : 'bg-warning/20 text-warning'
                              }`}>
                                {driver.verificationStatus === 'approved' ? 'Approved' : 
                                 driver.verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-text-secondary">Email</div>
                              <div className="text-text-primary">{driver.userId?.email}</div>
                            </div>
                            <div>
                              <div className="text-sm text-text-secondary">Phone</div>
                              <div className="text-text-primary">{driver.userId?.phone}</div>
                            </div>
                            {driver.licenseNumber && (
                              <div>
                                <div className="text-sm text-text-secondary">License Number</div>
                                <div className="text-text-primary">{driver.licenseNumber}</div>
                              </div>
                            )}
                            {driver.vehicleType && (
                              <div>
                                <div className="text-sm text-text-secondary">Vehicle</div>
                                <div className="text-text-primary">{driver.vehicleType} - {driver.vehicleNumber}</div>
                              </div>
                            )}
                            {driver.vehicleModel && (
                              <div>
                                <div className="text-sm text-text-secondary">Vehicle Model</div>
                                <div className="text-text-primary">{driver.vehicleModel}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-sm text-text-secondary mb-1">Aadhar Number</div>
                              {editingDriver === driver._id ? (
                                <input
                                  type="text"
                                  value={editFormData.aadharNumber || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                                    let formatted = value
                                    if (value.length > 4) {
                                      formatted = value.slice(0, 4) + ' ' + value.slice(4)
                                    }
                                    if (value.length > 8) {
                                      formatted = value.slice(0, 4) + ' ' + value.slice(4, 8) + ' ' + value.slice(8)
                                    }
                                    setEditFormData({ ...editFormData, aadharNumber: formatted })
                                  }}
                                  className="w-full px-3 py-1 bg-surface border border-border rounded-button text-text-primary text-sm"
                                  placeholder="1234 5678 9012"
                                  maxLength={14}
                                />
                              ) : (
                                <div className="text-text-primary">{driver.aadharNumber || 'Not provided'}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm text-text-secondary mb-1">PAN Number</div>
                              {editingDriver === driver._id ? (
                                <input
                                  type="text"
                                  value={editFormData.panNumber || ''}
                                  onChange={(e) => setEditFormData({ 
                                    ...editFormData, 
                                    panNumber: e.target.value.toUpperCase().slice(0, 10) 
                                  })}
                                  className="w-full px-3 py-1 bg-surface border border-border rounded-button text-text-primary text-sm uppercase"
                                  placeholder="ABCDE1234F"
                                  maxLength={10}
                                />
                              ) : (
                                <div className="text-text-primary">{driver.panNumber || 'Not provided'}</div>
                              )}
                            </div>
                          </div>
                          {driver.rejectionReason && (
                            <div className="bg-danger/10 border border-danger rounded-button p-3 mb-4">
                              <div className="text-sm font-semibold text-danger mb-1">Rejection Reason:</div>
                              <div className="text-sm text-text-secondary">{driver.rejectionReason}</div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {driver.profileImage && (
                              <div>
                                <div className="text-xs text-text-secondary mb-1">Profile Image</div>
                                <img 
                                  src={`${API_URL}${driver.profileImage}`} 
                                  alt="Profile" 
                                  onClick={() => openImagePopup(`${API_URL}${driver.profileImage}`, 'Profile Image')}
                                  className="w-24 h-24 rounded-button object-cover border border-border cursor-pointer hover:opacity-80 transition"
                                />
                              </div>
                            )}
                            {driver.vehicleImage && (
                              <div>
                                <div className="text-xs text-text-secondary mb-1">Vehicle Image</div>
                                <img 
                                  src={`${API_URL}${driver.vehicleImage}`} 
                                  alt="Vehicle" 
                                  onClick={() => openImagePopup(`${API_URL}${driver.vehicleImage}`, 'Vehicle Image')}
                                  className="w-24 h-24 rounded-button object-cover border border-border cursor-pointer hover:opacity-80 transition"
                                />
                              </div>
                            )}
                            {driver.aadharImage && (
                              <div>
                                <div className="text-xs text-text-secondary mb-1">Aadhar Card</div>
                                <img 
                                  src={`${API_URL}${driver.aadharImage}`} 
                                  alt="Aadhar" 
                                  onClick={() => openImagePopup(`${API_URL}${driver.aadharImage}`, 'Aadhar Card')}
                                  className="w-24 h-24 rounded-button object-cover border border-border cursor-pointer hover:opacity-80 transition"
                                />
                              </div>
                            )}
                            {driver.panImage && (
                              <div>
                                <div className="text-xs text-text-secondary mb-1">PAN Card</div>
                                <img 
                                  src={`${API_URL}${driver.panImage}`} 
                                  alt="PAN" 
                                  onClick={() => openImagePopup(`${API_URL}${driver.panImage}`, 'PAN Card')}
                                  className="w-24 h-24 rounded-button object-cover border border-border cursor-pointer hover:opacity-80 transition"
                                />
                              </div>
                            )}
                            {driver.vkycCaptureImages && driver.vkycCaptureImages.length > 0 && (
                              <>
                                {driver.vkycCaptureImages.map((image, index) => (
                                  <div key={index}>
                                    <div className="text-xs text-text-secondary mb-1">VKYC Capture {index + 1}</div>
                                    <img 
                                      src={`${API_URL}${image}`} 
                                      alt={`VKYC Capture ${index + 1}`} 
                                      onClick={() => openImagePopup(`${API_URL}${image}`, `VKYC Capture ${index + 1}`)}
                                      className="w-24 h-24 rounded-button object-cover border border-border cursor-pointer hover:opacity-80 transition"
                                    />
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                          {driver.vkycScheduledAt && (
                            <div className="mt-2 text-xs text-text-secondary">
                              VKYC Scheduled: {new Date(driver.vkycScheduledAt).toLocaleString()}
                              {driver.vkycStatus && ` | Status: ${driver.vkycStatus}`}
                            </div>
                          )}
                          <div className="mb-2">
                            {editingDriver === driver._id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveDriverDetails(driver._id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-accent text-text-light rounded-button text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition flex items-center"
                                >
                                  <FaSave className="mr-1" />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  disabled={loading}
                                  className="px-3 py-1 bg-surface border border-border text-text-primary rounded-button text-sm font-semibold hover:bg-secondary disabled:opacity-50 transition flex items-center"
                                >
                                  <FaTimes className="mr-1" />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditing(driver)}
                                className="px-3 py-1 bg-accent/10 border border-accent text-accent rounded-button text-sm font-semibold hover:bg-accent/20 transition flex items-center"
                              >
                                <FaEdit className="mr-1" />
                                Edit Aadhar/PAN
                              </button>
                            )}
                          </div>
                          <div className="text-sm text-text-secondary">
                            Total Rides: {driver.totalRides} | Earnings: ₹{driver.earnings} | Rating: {driver.rating || 'N/A'}
                          </div>
                          {driver.accountDetails && driver.accountDetails.accountNumber && (
                            <div className="mt-3 bg-accent/10 border border-accent/20 rounded-button p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-semibold text-accent">Account Details</div>
                                {editingAccountDetails === driver._id ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleUpdateAccountDetails(driver._id)}
                                      disabled={loading}
                                      className="px-2 py-1 bg-success text-text-light rounded-button text-xs font-semibold hover:bg-success/90 disabled:opacity-50 transition"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEditingAccountDetails}
                                      disabled={loading}
                                      className="px-2 py-1 bg-surface border border-border text-text-primary rounded-button text-xs font-semibold hover:bg-secondary disabled:opacity-50 transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditingAccountDetails(driver)}
                                    className="px-2 py-1 bg-accent/20 border border-accent text-accent rounded-button text-xs font-semibold hover:bg-accent/30 transition"
                                  >
                                    <FaEdit className="inline mr-1" />
                                    Edit
                                  </button>
                                )}
                              </div>
                              {editingAccountDetails === driver._id ? (
                                <div className="space-y-2 mt-2">
                                  <div>
                                    <label className="block text-xs text-text-secondary mb-1">Account Number</label>
                                    <input
                                      type="text"
                                      value={accountDetailsForm.accountNumber}
                                      onChange={(e) => setAccountDetailsForm({ ...accountDetailsForm, accountNumber: e.target.value })}
                                      className="w-full px-2 py-1 bg-surface border border-border rounded-button text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-text-secondary mb-1">IFSC Code</label>
                                    <input
                                      type="text"
                                      value={accountDetailsForm.ifscCode}
                                      onChange={(e) => setAccountDetailsForm({ ...accountDetailsForm, ifscCode: e.target.value.toUpperCase() })}
                                      className="w-full px-2 py-1 bg-surface border border-border rounded-button text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-text-secondary mb-1">Account Holder Name</label>
                                    <input
                                      type="text"
                                      value={accountDetailsForm.accountHolderName}
                                      onChange={(e) => setAccountDetailsForm({ ...accountDetailsForm, accountHolderName: e.target.value })}
                                      className="w-full px-2 py-1 bg-surface border border-border rounded-button text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                                      required
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-text-secondary space-y-1">
                                  <div>Account Number: <span className="text-text-primary font-semibold">{driver.accountDetails.accountNumber}</span></div>
                                  <div>IFSC Code: <span className="text-text-primary font-semibold">{driver.accountDetails.ifscCode}</span></div>
                                  <div>Account Holder: <span className="text-text-primary font-semibold">{driver.accountDetails.accountHolderName}</span></div>
                                </div>
                              )}
                            </div>
                          )}
                          {(!driver.accountDetails || !driver.accountDetails.accountNumber) && (
                            <div className="mt-3 bg-warning/10 border border-warning/20 rounded-button p-3">
                              <div className="text-xs text-text-secondary">No account details added yet</div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          {driver.verificationStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => approveDriver(driver._id)}
                                disabled={loading}
                                className="px-4 py-2 bg-success text-text-light rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition"
                              >
                                <FaCheckCircle className="inline mr-2" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Enter rejection reason:')
                                  if (reason) rejectDriver(driver._id, reason)
                                }}
                                disabled={loading}
                                className="px-4 py-2 bg-danger text-text-light rounded-button font-semibold hover:bg-danger/90 disabled:opacity-50 transition"
                              >
                                <FaTimesCircle className="inline mr-2" />
                                Reject
                              </button>
                            </>
                          )}
                          {driver.verificationStatus === 'approved' && (
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:')
                                if (reason) rejectDriver(driver._id, reason)
                              }}
                              disabled={loading}
                              className="px-4 py-2 bg-warning text-text-light rounded-button font-semibold hover:bg-warning/90 disabled:opacity-50 transition"
                            >
                              <FaTimesCircle className="inline mr-2" />
                              Revoke Approval
                            </button>
                          )}
                          {driver.verificationStatus === 'rejected' && (
                            <button
                              onClick={() => approveDriver(driver._id)}
                              disabled={loading}
                              className="px-4 py-2 bg-success text-text-light rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition"
                            >
                              <FaCheckCircle className="inline mr-2" />
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => deleteDriver(driver._id)}
                            disabled={loading}
                            className="px-4 py-2 bg-danger text-text-light rounded-button font-semibold hover:bg-danger/90 disabled:opacity-50 transition"
                          >
                            <FaTrash className="inline mr-2" />
                            Delete
                          </button>
                          <button
                            onClick={() => handleStartVKYC(driver._id, driver.userId?.name)}
                            disabled={loading || !driver.vkycScheduledAt || (driver.vkycStatus !== 'scheduled' && driver.vkycStatus !== 'in-progress')}
                            className="px-4 py-2 bg-accent text-text-light rounded-button font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            <FaVideo className="inline mr-2" />
                            Start VKYC Call
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {drivers.filter((driver) => {
                    if (driverFilter.status !== 'all' && driver.verificationStatus !== driverFilter.status) {
                      return false
                    }
                    if (!driverFilter.search) return true
                    const search = driverFilter.search.toLowerCase()
                    return (
                      driver.userId?.name?.toLowerCase().includes(search) ||
                      driver.userId?.email?.toLowerCase().includes(search) ||
                      driver.userId?.phone?.toLowerCase().includes(search) ||
                      driver.vehicleNumber?.toLowerCase().includes(search) ||
                      driver.licenseNumber?.toLowerCase().includes(search)
                    )
                  }).length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                      No drivers found matching your filters
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'rides' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-text-primary">All Rides</h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <select
                      value={rideFilter.status}
                      onChange={(e) => setRideFilter({ ...rideFilter, status: e.target.value })}
                      className="px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <input
                      type="text"
                      value={rideFilter.search}
                      onChange={(e) => setRideFilter({ ...rideFilter, search: e.target.value })}
                      placeholder="Search by ride ID, user, driver..."
                      className="px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent w-full sm:w-64"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {rides
                    .filter((ride) => {
                      if (rideFilter.status !== 'all' && ride.status !== rideFilter.status) {
                        return false
                      }
                      if (!rideFilter.search) return true
                      const search = rideFilter.search.toLowerCase()
                      return (
                        ride.rideId?.toLowerCase().includes(search) ||
                        ride.userId?.name?.toLowerCase().includes(search) ||
                        ride.userId?.email?.toLowerCase().includes(search) ||
                        ride.driverId?.vehicleNumber?.toLowerCase().includes(search) ||
                        ride.pickupLocation?.address?.toLowerCase().includes(search) ||
                        ride.dropoffLocation?.address?.toLowerCase().includes(search)
                      )
                    })
                    .map((ride) => (
                    <div key={ride._id} className="bg-surface rounded-button p-6 border border-border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ride.status)}`}>
                              {ride.status.toUpperCase()}
                            </span>
                            {ride.rideId && (
                              <span className="text-xs text-text-secondary">
                                ID: <span className="font-semibold text-accent">{ride.rideId}</span>
                              </span>
                            )}
                            <span className="text-sm text-text-secondary">
                              {new Date(ride.bookingTime).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-text-secondary space-y-1">
                            <div>From: {ride.pickupLocation.address}</div>
                            <div>To: {ride.dropoffLocation.address}</div>
                            <div>User: {ride.userId?.name} ({ride.userId?.email})</div>
                            {ride.driverId && (
                              <div>Driver: {ride.driverId.userId?.name || 'N/A'} - {ride.driverId.vehicleType} - {ride.driverId.vehicleNumber}</div>
                            )}
                            {ride.rideType && (
                              <div>
                                Ride Type: <span className="font-semibold capitalize">{ride.rideType}</span>
                              </div>
                            )}
                            {ride.paymentMethod && (
                              <div>
                                Payment: <span className="font-semibold capitalize text-accent">{ride.paymentMethod === 'wallet' || ride.paymentMethod === 'prepaid' ? 'Wallet' : ride.paymentMethod === 'online' || ride.paymentMethod === 'card' ? 'Online' : 'Cash'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-accent">₹{ride.fare}</div>
                          <div className="text-sm text-text-secondary">{ride.distance} km</div>
                          <div className="text-sm text-text-secondary capitalize">{ride.vehicleType}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {rides.filter((ride) => {
                    if (rideFilter.status !== 'all' && ride.status !== rideFilter.status) {
                      return false
                    }
                    if (!rideFilter.search) return true
                    const search = rideFilter.search.toLowerCase()
                    return (
                      ride.rideId?.toLowerCase().includes(search) ||
                      ride.userId?.name?.toLowerCase().includes(search) ||
                      ride.userId?.email?.toLowerCase().includes(search) ||
                      ride.driverId?.vehicleNumber?.toLowerCase().includes(search) ||
                      ride.pickupLocation?.address?.toLowerCase().includes(search) ||
                      ride.dropoffLocation?.address?.toLowerCase().includes(search)
                    )
                  }).length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                      No rides found matching your filters
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'coupons' && (
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">Manage Coupons</h2>
                
                {/* Add Coupon Form */}
                <div className="bg-surface border border-border rounded-button p-6 mb-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Create New Coupon</h3>
                  <form onSubmit={createCoupon} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Coupon Code</label>
                        <input
                          type="text"
                          value={newCoupon.code}
                          onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                          placeholder="SAVE20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Discount Type</label>
                        <select
                          value={newCoupon.discountType}
                          onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Discount Value</label>
                        <input
                          type="number"
                          value={newCoupon.discountValue}
                          onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Minimum Amount</label>
                        <input
                          type="number"
                          value={newCoupon.minAmount}
                          onChange={(e) => setNewCoupon({ ...newCoupon, minAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {newCoupon.discountType === 'percentage' && (
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">Max Discount (Optional)</label>
                          <input
                            type="number"
                            value={newCoupon.maxDiscount || ''}
                            onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                            min="0"
                            step="0.01"
                            placeholder="Optional"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Valid Until</label>
                        <input
                          type="datetime-local"
                          value={newCoupon.validUntil}
                          onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Usage Limit (Optional)</label>
                        <input
                          type="number"
                          value={newCoupon.usageLimit || ''}
                          onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          min="1"
                          placeholder="Unlimited if empty"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-accent text-text-light px-6 py-2 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50"
                    >
                      Create Coupon
                    </button>
                  </form>
                </div>

                {/* Coupons List */}
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-4">Existing Coupons</h3>
                  {coupons.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      <p>No coupons created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {coupons.map((coupon) => (
                        <div key={coupon._id} className="bg-surface border border-border rounded-button p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg font-bold text-accent">{coupon.code}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  coupon.isActive ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                                }`}>
                                  {coupon.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="text-sm text-text-secondary space-y-1">
                                <div>
                                  Discount: {coupon.discountType === 'percentage' 
                                    ? `${coupon.discountValue}%` 
                                    : `₹${coupon.discountValue}`}
                                  {coupon.maxDiscount && ` (Max: ₹${coupon.maxDiscount})`}
                                </div>
                                <div>Min Amount: ₹{coupon.minAmount}</div>
                                <div>Valid Until: {new Date(coupon.validUntil).toLocaleString()}</div>
                                {coupon.usageLimit && (
                                  <div>Usage: {coupon.usedCount} / {coupon.usageLimit}</div>
                                )}
                                {!coupon.usageLimit && (
                                  <div>Usage: {coupon.usedCount} (Unlimited)</div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteCoupon(coupon._id)}
                              disabled={loading}
                              className="text-danger hover:text-red-400 ml-4"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">Help & Support</h2>
                
                <div className="bg-surface border border-border rounded-button p-6 mb-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Search Ride by Booking ID</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchRideId}
                      onChange={(e) => setSearchRideId(e.target.value)}
                      placeholder="Enter Ride ID (e.g., RMMLM519ZP4680)"
                      className="flex-1 px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                    <button
                      onClick={searchRide}
                      disabled={loading || !searchRideId.trim()}
                      className="bg-accent text-text-light px-6 py-2 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50"
                    >
                      <FaSearch className="inline mr-2" />
                      Search
                    </button>
                  </div>
                </div>

                {searchedRide && (
                  <div className="bg-surface border border-border rounded-button p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Ride Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-text-secondary mb-1">Ride ID</div>
                          <div className="text-text-primary font-semibold">{searchedRide.rideId}</div>
                        </div>
                        <div>
                          <div className="text-sm text-text-secondary mb-1">Status</div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(searchedRide.status)}`}>
                            {searchedRide.status.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm text-text-secondary mb-1">Booking Date & Time</div>
                          <div className="text-text-primary">
                            <FaClock className="inline mr-1" />
                            {new Date(searchedRide.bookingTime).toLocaleString()}
                          </div>
                        </div>
                        {searchedRide.startTime && (
                          <div>
                            <div className="text-sm text-text-secondary mb-1">Start Time</div>
                            <div className="text-text-primary">
                              <FaClock className="inline mr-1" />
                              {new Date(searchedRide.startTime).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {searchedRide.endTime && (
                          <div>
                            <div className="text-sm text-text-secondary mb-1">End Time</div>
                            <div className="text-text-primary">
                              <FaClock className="inline mr-1" />
                              {new Date(searchedRide.endTime).toLocaleString()}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-text-secondary mb-1">Vehicle Type</div>
                          <div className="text-text-primary capitalize">{searchedRide.vehicleType}</div>
                        </div>
                        <div>
                          <div className="text-sm text-text-secondary mb-1">Distance</div>
                          <div className="text-text-primary">{searchedRide.distance} km</div>
                        </div>
                        <div>
                          <div className="text-sm text-text-secondary mb-1">Fare</div>
                          <div className="text-text-primary font-bold text-lg">
                            <FaRupeeSign className="inline" />
                            {searchedRide.fare.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-text-secondary mb-1">Payment Method</div>
                          <div className="text-text-primary capitalize">{searchedRide.paymentMethod}</div>
                        </div>
                        <div>
                          <div className="text-sm text-text-secondary mb-1">Payment Status</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            searchedRide.paymentStatus === 'completed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                          }`}>
                            {searchedRide.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="border-t border-border pt-4">
                        <div className="text-sm text-text-secondary mb-2">Pickup Location</div>
                        <div className="text-text-primary flex items-start">
                          <FaMapMarkerAlt className="text-accent-secondary mt-1 mr-2" />
                          {searchedRide.pickupLocation.address}
                        </div>
                      </div>
                      
                      <div className="border-t border-border pt-4">
                        <div className="text-sm text-text-secondary mb-2">Dropoff Location</div>
                        <div className="text-text-primary flex items-start">
                          <FaMapMarkerAlt className="text-accent mt-1 mr-2" />
                          {searchedRide.dropoffLocation.address}
                        </div>
                      </div>

                      {searchedRide.userId && (
                        <div className="border-t border-border pt-4">
                          <div className="text-sm text-text-secondary mb-2">User Details</div>
                          <div className="text-text-primary">
                            <div>Name: {searchedRide.userId.name}</div>
                            <div>Email: {searchedRide.userId.email}</div>
                            <div>Phone: {searchedRide.userId.phone}</div>
                          </div>
                        </div>
                      )}

                      {searchedRide.driverId && (
                        <div className="border-t border-border pt-4">
                          <div className="text-sm text-text-secondary mb-2">Driver Details</div>
                          <div className="text-text-primary">
                            {searchedRide.driverId.userId && (
                              <>
                                <div>Name: {searchedRide.driverId.userId.name}</div>
                                <div>Email: {searchedRide.driverId.userId.email}</div>
                                <div>Phone: {searchedRide.driverId.userId.phone}</div>
                              </>
                            )}
                            <div>Vehicle Type: {searchedRide.driverId.vehicleType}</div>
                            <div>Vehicle Number: {searchedRide.driverId.vehicleNumber}</div>
                            {searchedRide.driverId.vehicleModel && (
                              <div>Vehicle Model: {searchedRide.driverId.vehicleModel}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {searchedRide.couponCode && (
                        <div className="border-t border-border pt-4">
                          <div className="text-sm text-text-secondary mb-2">Coupon Applied</div>
                          <div className="text-text-primary">
                            Code: {searchedRide.couponCode}
                            {searchedRide.discountAmount > 0 && (
                              <span className="ml-2 text-success">Discount: ₹{searchedRide.discountAmount.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {searchedRide.rating && (
                        <div className="border-t border-border pt-4">
                          <div className="text-sm text-text-secondary mb-2">Rating & Review</div>
                          <div className="text-text-primary">
                            <div>Rating: {searchedRide.rating} / 5</div>
                            {searchedRide.review && (
                              <div className="mt-1">Review: {searchedRide.review}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">Wallet Management</h2>
                
                {/* Add Wallet Form */}
                <div className="bg-surface border border-border rounded-button p-6 mb-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Add Amount to Wallet</h3>
                  <form onSubmit={handleAddWallet} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Type</label>
                      <select
                        value={walletForm.type}
                        onChange={(e) => setWalletForm({ ...walletForm, type: e.target.value, userId: '', driverId: '' })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      >
                        <option value="user">User</option>
                        <option value="driver">Driver</option>
                      </select>
                    </div>

                    {walletForm.type === 'user' ? (
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Select User</label>
                        <div className="mb-2">
                          <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            placeholder="Search by User ID, name, email, or phone..."
                            className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                          />
                        </div>
                        <select
                          value={walletForm.userId}
                          onChange={(e) => setWalletForm({ ...walletForm, userId: e.target.value })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                        >
                          <option value="">Select a user</option>
                          {users
                            .filter((u) => {
                              if (!userSearchQuery) return true;
                              const query = userSearchQuery.toLowerCase();
                              return (
                                u.uniqueId?.toLowerCase().includes(query) ||
                                u.name?.toLowerCase().includes(query) ||
                                u.email?.toLowerCase().includes(query) ||
                                u.phone?.includes(query) ||
                                u._id?.toString().includes(query)
                              );
                            })
                            .map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.uniqueId ? `[${u.uniqueId}] ` : ''}{u.name} ({u.email}) - Current: ₹{u.wallet?.toFixed(2) || '0.00'}
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Select Driver</label>
                        <div className="mb-2">
                          <input
                            type="text"
                            value={driverSearchQuery}
                            onChange={(e) => setDriverSearchQuery(e.target.value)}
                            placeholder="Search by Driver ID, name, email, or phone..."
                            className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                          />
                        </div>
                        <select
                          value={walletForm.driverId}
                          onChange={(e) => setWalletForm({ ...walletForm, driverId: e.target.value })}
                          className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                          required
                        >
                          <option value="">Select a driver</option>
                          {drivers
                            .filter((d) => {
                              if (!driverSearchQuery) return true;
                              const query = driverSearchQuery.toLowerCase();
                              return (
                                d.uniqueId?.toLowerCase().includes(query) ||
                                d.userId?.name?.toLowerCase().includes(query) ||
                                d.userId?.email?.toLowerCase().includes(query) ||
                                d.userId?.phone?.includes(query) ||
                                d._id?.toString().includes(query)
                              );
                            })
                            .map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.uniqueId ? `[${d.uniqueId}] ` : ''}{d.userId?.name} ({d.userId?.email}) - Current: ₹{d.earnings?.toFixed(2) || '0.00'}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Amount (₹)</label>
                      <input
                        type="number"
                        value={walletForm.amount}
                        onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="Enter amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Remark (Optional)</label>
                      <input
                        type="text"
                        value={walletForm.remark}
                        onChange={(e) => setWalletForm({ ...walletForm, remark: e.target.value })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="Enter remark (optional)"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-accent text-text-light px-6 py-2 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add to Wallet'}
                    </button>
                  </form>
                </div>

                {/* User Wallets */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4">User Wallets</h3>
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div key={u._id} className="bg-surface border border-border rounded-button p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-text-primary">{u.name}</div>
                            {u.uniqueId && (
                              <div className="text-xs text-accent font-semibold mb-1">User ID: {u.uniqueId}</div>
                            )}
                            <div className="text-sm text-text-secondary">{u.email}</div>
                            <div className="text-sm text-text-secondary">Phone: {u.phone}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-text-secondary mb-1">Wallet Balance</div>
                            <div className="text-2xl font-bold text-accent">₹{u.wallet?.toFixed(2) || '0.00'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Driver Wallets */}
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-4">Driver Wallets (Earnings)</h3>
                  <div className="space-y-3">
                    {drivers.map((d) => (
                      <div key={d._id} className="bg-surface border border-border rounded-button p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-text-primary">{d.userId?.name}</div>
                            {d.uniqueId && (
                              <div className="text-xs text-accent font-semibold mb-1">Driver ID: {d.uniqueId}</div>
                            )}
                            <div className="text-sm text-text-secondary">{d.userId?.email}</div>
                            <div className="text-sm text-text-secondary">Phone: {d.userId?.phone}</div>
                            <div className="text-sm text-text-secondary">Vehicle: {d.vehicleType} - {d.vehicleNumber}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-text-secondary mb-1">Total Earnings</div>
                            <div className="text-2xl font-bold text-accent">₹{d.earnings?.toFixed(2) || '0.00'}</div>
                            <div className="text-xs text-text-secondary mt-1">Rides: {d.totalRides || 0}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'walletToAccount' && (
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">Wallet to Account - Withdrawal Requests</h2>
                
                {/* Filter Section */}
                <div className="bg-surface border border-border rounded-button p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Filter by Status</label>
                      <select
                        value={withdrawalFilter.status}
                        onChange={(e) => setWithdrawalFilter({ ...withdrawalFilter, status: e.target.value })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
                      <input
                        type="text"
                        value={withdrawalFilter.search}
                        onChange={(e) => setWithdrawalFilter({ ...withdrawalFilter, search: e.target.value })}
                        placeholder="Search by driver name, email, transaction ID, account number..."
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {withdrawals.filter((withdrawal) => {
                  if (withdrawalFilter.status !== 'all' && withdrawal.status !== withdrawalFilter.status) {
                    return false;
                  }
                  if (withdrawalFilter.search) {
                    const query = withdrawalFilter.search.toLowerCase();
                    return (
                      withdrawal.driverId?.userId?.name?.toLowerCase().includes(query) ||
                      withdrawal.driverId?.userId?.email?.toLowerCase().includes(query) ||
                      withdrawal.driverId?.uniqueId?.toLowerCase().includes(query) ||
                      withdrawal.transactionId?.toLowerCase().includes(query) ||
                      withdrawal.accountNumber?.includes(query) ||
                      withdrawal.accountHolderName?.toLowerCase().includes(query)
                    );
                  }
                  return true;
                }).length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <p>No withdrawal requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals
                      .filter((withdrawal) => {
                        if (withdrawalFilter.status !== 'all' && withdrawal.status !== withdrawalFilter.status) {
                          return false;
                        }
                        if (withdrawalFilter.search) {
                          const query = withdrawalFilter.search.toLowerCase();
                          return (
                            withdrawal.driverId?.userId?.name?.toLowerCase().includes(query) ||
                            withdrawal.driverId?.userId?.email?.toLowerCase().includes(query) ||
                            withdrawal.driverId?.uniqueId?.toLowerCase().includes(query) ||
                            withdrawal.transactionId?.toLowerCase().includes(query) ||
                            withdrawal.accountNumber?.includes(query) ||
                            withdrawal.accountHolderName?.toLowerCase().includes(query)
                          );
                        }
                        return true;
                      })
                      .map((withdrawal) => (
                      <div key={withdrawal._id} className="bg-surface border border-border rounded-button p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                withdrawal.status === 'completed' ? 'bg-success/20 text-success' :
                                withdrawal.status === 'rejected' ? 'bg-danger/20 text-danger' :
                                'bg-warning/20 text-warning'
                              }`}>
                                {withdrawal.status.toUpperCase()}
                              </span>
                              {withdrawal.transactionId && (
                                <span className="text-xs text-text-secondary">
                                  TXN ID: <span className="font-semibold text-accent">{withdrawal.transactionId}</span>
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm text-text-secondary">Driver: </span>
                                <span className="text-text-primary font-semibold">
                                  {withdrawal.driverId?.userId?.name || 'N/A'}
                                </span>
                                {withdrawal.driverId?.uniqueId && (
                                  <span className="text-xs text-text-secondary ml-2">
                                    (ID: {withdrawal.driverId.uniqueId})
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-sm text-text-secondary">Amount: </span>
                                <span className="text-accent font-bold text-lg">₹{withdrawal.amount.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-sm text-text-secondary">Account Number: </span>
                                <span className="text-text-primary font-semibold">{withdrawal.accountNumber}</span>
                              </div>
                              <div>
                                <span className="text-sm text-text-secondary">IFSC Code: </span>
                                <span className="text-text-primary font-semibold">{withdrawal.ifscCode}</span>
                              </div>
                              <div>
                                <span className="text-sm text-text-secondary">Account Holder: </span>
                                <span className="text-text-primary font-semibold">{withdrawal.accountHolderName}</span>
                              </div>
                              <div>
                                <span className="text-sm text-text-secondary">Requested At: </span>
                                <span className="text-text-primary">
                                  {new Date(withdrawal.requestedAt).toLocaleString()}
                                </span>
                              </div>
                              {withdrawal.processedAt && (
                                <div>
                                  <span className="text-sm text-text-secondary">Processed At: </span>
                                  <span className="text-text-primary">
                                    {new Date(withdrawal.processedAt).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {withdrawal.utrNumber && (
                                <div>
                                  <span className="text-sm text-text-secondary">UTR Number: </span>
                                  <span className="text-accent font-semibold">{withdrawal.utrNumber}</span>
                                </div>
                              )}
                              {withdrawal.adminRemark && (
                                <div>
                                  <span className="text-sm text-text-secondary">Admin Remark: </span>
                                  <span className="text-text-primary">{withdrawal.adminRemark}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {withdrawal.status === 'pending' && (
                            <div className="flex flex-col space-y-2 ml-4">
                              <button
                                onClick={() => {
                                  const utrNumber = prompt('Enter UTR Number (required):')
                                  if (utrNumber && utrNumber.trim() !== '') {
                                    const remark = prompt('Enter remark (optional):')
                                    approveWithdrawal(withdrawal._id, utrNumber.trim(), remark || '')
                                  }
                                }}
                                disabled={loading}
                                className="px-4 py-2 bg-success text-text-light rounded-button font-semibold hover:bg-success/90 disabled:opacity-50 transition"
                              >
                                <FaCheckCircle className="inline mr-2" />
                                Approve
                              </button>
                              <button
                                onClick={() => rejectWithdrawal(withdrawal._id)}
                                disabled={loading}
                                className="px-4 py-2 bg-danger text-text-light rounded-button font-semibold hover:bg-danger/90 disabled:opacity-50 transition"
                              >
                                <FaTimesCircle className="inline mr-2" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">All Transactions</h2>
                
                {/* Filter Section */}
                <div className="bg-surface border border-border rounded-button p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Filter by Type</label>
                      <select
                        value={transactionFilter.type}
                        onChange={(e) => setTransactionFilter({ ...transactionFilter, type: e.target.value })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="credit">Credit</option>
                        <option value="debit">Debit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Filter by Role</label>
                      <select
                        value={transactionFilter.role}
                        onChange={(e) => setTransactionFilter({ ...transactionFilter, role: e.target.value })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      >
                        <option value="all">All Roles</option>
                        <option value="user">User</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Date From</label>
                      <input
                        type="date"
                        value={transactionFilter.dateFrom}
                        onChange={(e) => setTransactionFilter({ ...transactionFilter, dateFrom: e.target.value })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Date To</label>
                      <input
                        type="date"
                        value={transactionFilter.dateTo}
                        onChange={(e) => setTransactionFilter({ ...transactionFilter, dateTo: e.target.value })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
                      <input
                        type="text"
                        value={transactionFilter.search}
                        onChange={(e) => setTransactionFilter({ ...transactionFilter, search: e.target.value })}
                        placeholder="Search by name, email, ID, description..."
                        className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {transactions.filter((transaction) => {
                  // Filter by type
                  if (transactionFilter.type !== 'all' && transaction.type !== transactionFilter.type) {
                    return false;
                  }
                  
                  // Filter by role
                  if (transactionFilter.role !== 'all') {
                    if (transactionFilter.role === 'user' && !transaction.userId) return false;
                    if (transactionFilter.role === 'driver' && !transaction.driverId) return false;
                    if (transactionFilter.role === 'admin' && transaction.description?.toLowerCase().includes('ride mitra')) return true;
                    if (transactionFilter.role === 'admin' && !transaction.description?.toLowerCase().includes('ride mitra')) return false;
                  }
                  
                  // Filter by date range
                  if (transactionFilter.dateFrom) {
                    const fromDate = new Date(transactionFilter.dateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (new Date(transaction.createdAt) < fromDate) return false;
                  }
                  if (transactionFilter.dateTo) {
                    const toDate = new Date(transactionFilter.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (new Date(transaction.createdAt) > toDate) return false;
                  }
                  
                  // Filter by search query
                  if (transactionFilter.search) {
                    const query = transactionFilter.search.toLowerCase();
                    return (
                      transaction.userId?.name?.toLowerCase().includes(query) ||
                      transaction.userId?.email?.toLowerCase().includes(query) ||
                      transaction.userId?.uniqueId?.toLowerCase().includes(query) ||
                      transaction.driverId?.userId?.name?.toLowerCase().includes(query) ||
                      transaction.driverId?.userId?.email?.toLowerCase().includes(query) ||
                      transaction.driverId?.uniqueId?.toLowerCase().includes(query) ||
                      transaction.description?.toLowerCase().includes(query) ||
                      transaction.rideId?.rideId?.toLowerCase().includes(query) ||
                      transaction._id?.toString().includes(query)
                    );
                  }
                  
                  return true;
                }).length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <p>No transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-divider">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">User/Driver</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Payment Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Balance After</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Ride ID</th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border">
                        {transactions
                          .filter((transaction) => {
                            // Filter by type
                            if (transactionFilter.type !== 'all' && transaction.type !== transactionFilter.type) {
                              return false;
                            }
                            
                            // Filter by role
                            if (transactionFilter.role !== 'all') {
                              if (transactionFilter.role === 'user' && !transaction.userId) return false;
                              if (transactionFilter.role === 'driver' && !transaction.driverId) return false;
                              if (transactionFilter.role === 'admin' && transaction.description?.toLowerCase().includes('ride mitra')) return true;
                              if (transactionFilter.role === 'admin' && !transaction.description?.toLowerCase().includes('ride mitra')) return false;
                            }
                            
                            // Filter by date range
                            if (transactionFilter.dateFrom) {
                              const fromDate = new Date(transactionFilter.dateFrom);
                              fromDate.setHours(0, 0, 0, 0);
                              if (new Date(transaction.createdAt) < fromDate) return false;
                            }
                            if (transactionFilter.dateTo) {
                              const toDate = new Date(transactionFilter.dateTo);
                              toDate.setHours(23, 59, 59, 999);
                              if (new Date(transaction.createdAt) > toDate) return false;
                            }
                            
                            // Filter by search query
                            if (transactionFilter.search) {
                              const query = transactionFilter.search.toLowerCase();
                              return (
                                transaction.userId?.name?.toLowerCase().includes(query) ||
                                transaction.userId?.email?.toLowerCase().includes(query) ||
                                transaction.userId?.uniqueId?.toLowerCase().includes(query) ||
                                transaction.driverId?.userId?.name?.toLowerCase().includes(query) ||
                                transaction.driverId?.userId?.email?.toLowerCase().includes(query) ||
                                transaction.driverId?.uniqueId?.toLowerCase().includes(query) ||
                                transaction.description?.toLowerCase().includes(query) ||
                                transaction.rideId?.rideId?.toLowerCase().includes(query) ||
                                transaction._id?.toString().includes(query)
                              );
                            }
                            
                            return true;
                          })
                          .map((transaction) => (
                            <tr key={transaction._id} className="hover:bg-secondary/50 transition">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  transaction.type === 'credit'
                                    ? 'bg-success/20 text-success'
                                    : 'bg-danger/20 text-danger'
                                }`}>
                                  {transaction.type.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                {transaction.driverId ? (
                                  <div>
                                    <div className="font-semibold">{transaction.driverId.userId?.name || 'N/A'}</div>
                                    {transaction.driverId.uniqueId && (
                                      <div className="text-xs text-accent">Driver ID: {transaction.driverId.uniqueId}</div>
                                    )}
                                    <div className="text-xs text-text-secondary">{transaction.driverId.userId?.email}</div>
                                  </div>
                                ) : transaction.userId ? (
                                  <div>
                                    <div className="font-semibold">{transaction.userId.name || 'N/A'}</div>
                                    {transaction.userId.uniqueId && (
                                      <div className="text-xs text-accent">User ID: {transaction.userId.uniqueId}</div>
                                    )}
                                    <div className="text-xs text-text-secondary">{transaction.userId.email}</div>
                                  </div>
                                ) : (
                                  <span className="text-text-secondary">N/A</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-text-primary max-w-xs truncate" title={transaction.description}>
                                {transaction.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                {transaction.rideId?.paymentMethod ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent capitalize">
                                    {transaction.rideId.paymentMethod === 'wallet' || transaction.rideId.paymentMethod === 'prepaid' ? 'Wallet' : transaction.rideId.paymentMethod === 'online' || transaction.rideId.paymentMethod === 'card' ? 'Online' : 'Cash'}
                                  </span>
                                ) : (
                                  <span className="text-text-secondary">-</span>
                                )}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                transaction.type === 'credit' ? 'text-success' : 'text-danger'
                              }`}>
                                {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                ₹{transaction.balanceAfter.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">
                                {transaction.rideId?.rideId || '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
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

export default AdminDashboard

