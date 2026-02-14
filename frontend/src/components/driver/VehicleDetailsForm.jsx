import { useState } from 'react'
import axios from 'axios'
import { FaCar, FaMotorcycle, FaIdCard } from 'react-icons/fa'

const VehicleDetailsForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    licenseNumber: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    vehicleModel: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    try {
      await axios.post('/api/driver/vehicle-details', formData)
      if (onSuccess) onSuccess()
      setFormData({
        licenseNumber: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        vehicleModel: ''
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vehicle details')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-button p-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">Add Vehicle Details</h3>
      <p className="text-sm text-text-secondary mb-6">
        Please add your vehicle information to start accepting rides.
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <FaIdCard className="inline mr-2 text-accent" />
            License Number
          </label>
          <input
            type="text"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="DL1234567890"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Vehicle Type
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, vehicleType: 'bike' })}
              className={`p-4 border-2 rounded-button text-center transition ${
                formData.vehicleType === 'bike'
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50 bg-surface'
              }`}
            >
              <FaMotorcycle className="text-3xl mx-auto mb-2 text-accent" />
              <div className="font-semibold text-text-primary">Bike</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, vehicleType: 'auto' })}
              className={`p-4 border-2 rounded-button text-center transition ${
                formData.vehicleType === 'auto'
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50 bg-surface'
              }`}
            >
              <FaCar className="text-3xl mx-auto mb-2 text-accent" />
              <div className="font-semibold text-text-primary">Auto</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, vehicleType: 'car' })}
              className={`p-4 border-2 rounded-button text-center transition ${
                formData.vehicleType === 'car'
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50 bg-surface'
              }`}
            >
              <FaCar className="text-3xl mx-auto mb-2 text-accent" />
              <div className="font-semibold text-text-primary">Car</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Vehicle Number
          </label>
          <input
            type="text"
            name="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="MH12AB1234"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Vehicle Model
          </label>
          <input
            type="text"
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Honda Activa"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-text-light py-3 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Vehicle Details'}
        </button>
      </form>
    </div>
  )
}

export default VehicleDetailsForm

