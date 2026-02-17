import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaRocket, FaArrowLeft } from 'react-icons/fa'
import SplashScreen from '../components/SplashScreen'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const { login } = useAuth()
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

    const result = await login(formData.email, formData.password)

    if (result.success) {
      setShowSplash(true)
      setTimeout(() => {
        const userRole = result.user?.role || JSON.parse(localStorage.getItem('user') || '{}').role
        if (userRole === 'admin') {
          navigate('/admin')
        } else if (userRole === 'driver') {
          navigate('/driver')
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
      <div className="max-w-md w-full space-y-8 bg-surface p-10 rounded-button shadow-xl border border-border">
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
            Sign in to your account
          </h2>
          <p className="mt-3 text-center text-sm text-text-secondary">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-accent hover:text-accent-secondary"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/30 border border-danger text-danger px-4 py-3 rounded-button">
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-4 py-3 bg-surface border border-border rounded-button placeholder-text-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm transition"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full px-4 py-3 bg-surface border border-border rounded-button placeholder-text-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm transition"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-button text-text-light bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login

