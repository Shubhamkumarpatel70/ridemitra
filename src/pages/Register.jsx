import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaRocket, FaArrowLeft } from 'react-icons/fa'
import SplashScreen from '../components/SplashScreen'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await register(formData)

    if (result.success) {
      setShowSplash(true)
      setTimeout(() => {
        const userRole = result.user?.role || JSON.parse(localStorage.getItem('user') || '{}').role
        if (userRole === 'admin') {
          navigate('/admin')
        } else if (userRole === 'driver') {
          navigate('/driver/register')
        } else {
          navigate('/user')
        }
      }, 2000)
    } else {
      setError(result.message)
      setLoading(false)
    }
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-10 rounded-button shadow-xl border border-border overflow-y-auto max-h-[90vh]">
        <div>
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-text-secondary hover:text-text-primary flex items-center"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <div className="flex justify-center">
            <FaRocket className="text-accent text-5xl" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-accent hover:text-accent"
            >
              sign in to existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/30 border border-danger text-danger px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-surface border border-border placeholder-text-secondary text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent sm:text-sm"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-primary border border-accent/20 placeholder-text-secondary text-text-primary placeholder-text-secondary text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent sm:text-sm"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-primary">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-primary border border-accent/20 placeholder-text-secondary text-text-primary placeholder-text-secondary text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent sm:text-sm"
                placeholder="+91 1234567890"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-primary border border-accent/20 placeholder-text-secondary text-text-primary placeholder-text-secondary text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent sm:text-sm"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-text-primary">
                I want to
              </label>
              <select
                id="role"
                name="role"
                className="mt-1 block w-full px-3 py-2 bg-surface border border-border text-text-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="user">Book Rides</option>
                <option value="driver">Drive & Earn</option>
              </select>
            </div>
            {formData.role === 'driver' && (
              <div className="bg-warning/10 border border-warning rounded-button p-4">
                <p className="text-sm text-text-secondary">
                  <strong className="text-accent">Note:</strong> After registration, your account will be reviewed by admin. 
                  Once approved, you'll be able to add your vehicle details and start accepting rides.
                </p>
              </div>
            )}
          </div>

          <div>
              <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-button text-text-light bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register

