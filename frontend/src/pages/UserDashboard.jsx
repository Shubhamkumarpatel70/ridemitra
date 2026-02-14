import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { FaMapMarkerAlt, FaCar, FaHistory, FaUser, FaSignOutAlt, FaMotorcycle, FaWallet, FaExchangeAlt } from 'react-icons/fa'
import BookRide from '../components/user/BookRide'
import RideHistory from '../components/user/RideHistory'
import UserProfile from '../components/user/UserProfile'
import ActiveRide from '../components/user/ActiveRide'

const UserDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on mount
    return localStorage.getItem('userActiveTab') || 'book'
  })
  const [activeRide, setActiveRide] = useState(null)
  const [wallet, setWallet] = useState(0)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    fetchActiveRide()
    fetchWallet()
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
    const interval = setInterval(fetchActiveRide, 3000) // Poll every 3 seconds for faster updates
    return () => clearInterval(interval)
  }, [activeTab])

  const [userProfile, setUserProfile] = useState(null)

  const fetchWallet = async () => {
    try {
      const res = await axios.get('/api/auth/profile')
      if (res.data) {
        if (res.data.wallet !== undefined) {
          setWallet(res.data.wallet || 0)
        }
        // Update user profile with uniqueId
        setUserProfile(res.data)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/auth/transactions')
      setTransactions(res.data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchActiveRide = async () => {
    try {
      const res = await axios.get('/api/rides')
      const active = res.data.find(r => 
        r.status === 'pending' || r.status === 'accepted' || r.status === 'in-progress'
      )
      if (active) {
        const fullRide = await axios.get(`/api/rides/${active._id}`)
        // Ensure driver is populated
        if (fullRide.data.driverId && typeof fullRide.data.driverId === 'object') {
          // Driver is already populated
          setActiveRide(fullRide.data)
        } else if (fullRide.data.driverId) {
          // Need to populate driver
          const driverRes = await axios.get(`/api/driver/profile`)
          setActiveRide({
            ...fullRide.data,
            driverId: {
              ...driverRes.data,
              userId: driverRes.data.userId
            }
          })
        } else {
          setActiveRide(fullRide.data)
        }
      } else {
        setActiveRide(null)
      }
    } catch (error) {
      console.error('Error fetching active ride:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-secondary">
      <nav className="bg-surface border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 py-2">
            <div className="flex items-center">
              <FaCar className="text-accent text-xl sm:text-2xl mr-2" />
              <span className="text-lg sm:text-xl font-bold text-text-primary">Ride Mitra</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 bg-accent/10 border border-accent/20 rounded-button px-2 sm:px-3 py-1">
                <FaWallet className="text-accent text-sm sm:text-base" />
                <span className="text-xs sm:text-sm text-text-primary font-semibold">₹{wallet.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs sm:text-sm text-text-secondary hidden sm:inline">Welcome, {user?.name}</span>
                <span className="text-xs text-text-secondary sm:hidden">{user?.name?.split(' ')[0]}</span>
                {(userProfile?.uniqueId || user?.uniqueId) && (
                  <span className="text-xs text-accent font-semibold">ID: {userProfile?.uniqueId || user?.uniqueId}</span>
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeRide && <ActiveRide ride={activeRide} onUpdate={fetchActiveRide} />}
        
        <div className="bg-surface border border-border rounded-button shadow-md overflow-hidden">
          <div className="border-b border-border overflow-x-auto">
            <nav className="flex -mb-px min-w-max sm:min-w-0">
              <button
                onClick={() => {
                  setActiveTab('book')
                  localStorage.setItem('userActiveTab', 'book')
                }}
                className={`py-3 sm:py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                  activeTab === 'book'
                    ? 'border-primary text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaCar className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Book Ride</span>
                <span className="sm:hidden">Book</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('history')
                  localStorage.setItem('userActiveTab', 'history')
                }}
                className={`py-3 sm:py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'border-primary text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaHistory className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ride History</span>
                <span className="sm:hidden">History</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('transactions')
                  localStorage.setItem('userActiveTab', 'transactions')
                }}
                className={`py-3 sm:py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'border-primary text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaExchangeAlt className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Transactions</span>
                <span className="sm:hidden">Transactions</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('profile')
                  localStorage.setItem('userActiveTab', 'profile')
                }}
                className={`py-3 sm:py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-primary text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <FaUser className="inline mr-1 sm:mr-2" />
                Profile
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'book' && <BookRide onRideBooked={() => { fetchWallet(); fetchTransactions(); fetchActiveRide(); }} activeRide={activeRide} />}
            {activeTab === 'history' && <RideHistory />}
            {activeTab === 'transactions' && (
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">Transaction History</h2>
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
            {activeTab === 'profile' && <UserProfile />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard