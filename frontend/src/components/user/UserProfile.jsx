import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FaUser, FaEnvelope, FaPhone } from 'react-icons/fa'
import axios from 'axios'

const UserProfile = () => {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/auth/profile')
        setUserProfile(res.data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }
    fetchProfile()
  }, [])

  const displayUser = userProfile || user

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Profile</h2>
      <div className="bg-surface border border-border rounded-button p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center">
            <FaUser className="text-4xl text-accent" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-text-primary">{displayUser?.name}</h3>
            {displayUser?.uniqueId && (
              <p className="text-accent font-semibold text-sm mb-1">User ID: {displayUser.uniqueId}</p>
            )}
            <p className="text-text-secondary capitalize">{displayUser?.role}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <FaEnvelope className="text-text-secondary" />
            <div>
              <div className="text-sm text-text-secondary">Email</div>
              <div className="font-medium text-text-primary">{displayUser?.email}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FaPhone className="text-text-secondary" />
            <div>
              <div className="text-sm text-text-secondary">Phone</div>
              <div className="font-medium text-text-primary">{displayUser?.phone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
