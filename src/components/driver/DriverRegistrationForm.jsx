import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaUser, FaIdCard, FaCar, FaCamera, FaArrowRight, FaArrowLeft, FaCheck } from 'react-icons/fa'

const DriverRegistrationForm = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    licenseNumber: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    vehicleModel: '',
    aadharNumber: '',
    panNumber: ''
  })

  const [images, setImages] = useState({
    profileImage: null,
    vehicleImage: null,
    aadharImage: null,
    panImage: null
  })

  const [imagePreviews, setImagePreviews] = useState({
    profileImage: null,
    vehicleImage: null,
    aadharImage: null,
    panImage: null
  })

  const totalSteps = 5

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (e, field) => {
    const file = e.target.files[0]
    if (file) {
      setImages({
        ...images,
        [field]: file
      })
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews({
          ...imagePreviews,
          [field]: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      
      // Add text fields (remove spaces from Aadhar number)
      Object.keys(formData).forEach(key => {
        let value = formData[key]
        if (key === 'aadharNumber') {
          value = value.replace(/\s/g, '') // Remove spaces
          if (value.length !== 12) {
            setError('Aadhar number must be exactly 12 digits')
            setLoading(false)
            return
          }
        }
        formDataToSend.append(key, value)
      })

      // Add images
      if (images.profileImage) formDataToSend.append('profileImage', images.profileImage)
      if (images.vehicleImage) formDataToSend.append('vehicleImage', images.vehicleImage)
      if (images.aadharImage) formDataToSend.append('aadharImage', images.aadharImage)
      if (images.panImage) formDataToSend.append('panImage', images.panImage)

      await axios.post('/api/driver/register-details', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      navigate('/driver')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit driver details')
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Step 1: Personal Information</h3>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <FaIdCard className="inline mr-2 text-accent" />
                Driving License Number
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
                <FaCamera className="inline mr-2 text-accent" />
                Profile Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-button flex items-center justify-center overflow-hidden">
                  {imagePreviews.profileImage ? (
                    <img src={imagePreviews.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <FaCamera className="text-4xl text-text-secondary" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'profileImage')}
                    className="hidden"
                    id="profileImage"
                  />
                  <label
                    htmlFor="profileImage"
                    className="px-4 py-2 bg-accent text-text-light rounded-button font-semibold hover:bg-accent-hover cursor-pointer inline-block"
                  >
                    Upload Image
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Step 2: Vehicle Information</h3>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Vehicle Type</label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="bike">Bike</option>
                <option value="auto">Auto</option>
                <option value="car">Car</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Vehicle Number</label>
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
              <label className="block text-sm font-medium text-text-primary mb-2">Vehicle Model/Name</label>
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
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <FaCamera className="inline mr-2 text-accent" />
                Vehicle Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-button flex items-center justify-center overflow-hidden">
                  {imagePreviews.vehicleImage ? (
                    <img src={imagePreviews.vehicleImage} alt="Vehicle" className="w-full h-full object-cover" />
                  ) : (
                    <FaCar className="text-4xl text-text-secondary" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'vehicleImage')}
                    className="hidden"
                    id="vehicleImage"
                  />
                  <label
                    htmlFor="vehicleImage"
                    className="px-4 py-2 bg-accent text-text-light rounded-button font-semibold hover:bg-accent-hover cursor-pointer inline-block"
                  >
                    Upload Image
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Step 3: Aadhar Card</h3>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <FaIdCard className="inline mr-2 text-accent" />
                Aadhar Number
              </label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={(e) => {
                  // Format as 4-4-4 (only digits, max 12)
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                  let formatted = value
                  if (value.length > 4) {
                    formatted = value.slice(0, 4) + ' ' + value.slice(4)
                  }
                  if (value.length > 8) {
                    formatted = value.slice(0, 4) + ' ' + value.slice(4, 8) + ' ' + value.slice(8)
                  }
                  setFormData({
                    ...formData,
                    aadharNumber: formatted
                  })
                }}
                required
                maxLength={14} // 12 digits + 2 spaces
                className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="1234 5678 9012"
              />
              {formData.aadharNumber.replace(/\D/g, '').length !== 12 && formData.aadharNumber.length > 0 && (
                <p className="text-sm text-danger mt-1">Aadhar number must be 12 digits</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <FaCamera className="inline mr-2 text-accent" />
                Aadhar Card Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-button flex items-center justify-center overflow-hidden">
                  {imagePreviews.aadharImage ? (
                    <img src={imagePreviews.aadharImage} alt="Aadhar" className="w-full h-full object-cover" />
                  ) : (
                    <FaIdCard className="text-4xl text-text-secondary" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'aadharImage')}
                    className="hidden"
                    id="aadharImage"
                  />
                  <label
                    htmlFor="aadharImage"
                    className="px-4 py-2 bg-accent text-text-light rounded-button font-semibold hover:bg-accent-hover cursor-pointer inline-block"
                  >
                    Upload Image
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Step 4: PAN Card</h3>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <FaIdCard className="inline mr-2 text-accent" />
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                required
                maxLength={10}
                className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent uppercase"
                placeholder="ABCDE1234F"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <FaCamera className="inline mr-2 text-accent" />
                PAN Card Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-button flex items-center justify-center overflow-hidden">
                  {imagePreviews.panImage ? (
                    <img src={imagePreviews.panImage} alt="PAN" className="w-full h-full object-cover" />
                  ) : (
                    <FaIdCard className="text-4xl text-text-secondary" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'panImage')}
                    className="hidden"
                    id="panImage"
                  />
                  <label
                    htmlFor="panImage"
                    className="px-4 py-2 bg-accent text-text-light rounded-button font-semibold hover:bg-accent-hover cursor-pointer inline-block"
                  >
                    Upload Image
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Step 5: Review & Submit</h3>
            <div className="bg-surface border border-border rounded-button p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Personal Information</h4>
                <p className="text-text-secondary">License: {formData.licenseNumber}</p>
                {imagePreviews.profileImage && (
                  <img src={imagePreviews.profileImage} alt="Profile" className="w-20 h-20 rounded-button mt-2 object-cover" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Vehicle Information</h4>
                <p className="text-text-secondary">Type: {formData.vehicleType}</p>
                <p className="text-text-secondary">Number: {formData.vehicleNumber}</p>
                <p className="text-text-secondary">Model: {formData.vehicleModel}</p>
                {imagePreviews.vehicleImage && (
                  <img src={imagePreviews.vehicleImage} alt="Vehicle" className="w-20 h-20 rounded-button mt-2 object-cover" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Aadhar Card</h4>
                <p className="text-text-secondary">Number: {formData.aadharNumber}</p>
                {imagePreviews.aadharImage && (
                  <img src={imagePreviews.aadharImage} alt="Aadhar" className="w-20 h-20 rounded-button mt-2 object-cover" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">PAN Card</h4>
                <p className="text-text-secondary">Number: {formData.panNumber}</p>
                {imagePreviews.panImage && (
                  <img src={imagePreviews.panImage} alt="PAN" className="w-20 h-20 rounded-button mt-2 object-cover" />
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-surface border border-border rounded-button shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Driver Registration</h2>
          <div className="flex items-center space-x-2 mb-4">
            {[...Array(totalSteps)].map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex-1 h-2 rounded-full ${
                  i + 1 <= currentStep ? 'bg-accent' : 'bg-border'
                }`} />
                {i < totalSteps - 1 && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    i + 1 < currentStep ? 'bg-accent text-text-light' : 
                    i + 1 === currentStep ? 'bg-accent text-text-light' : 
                    'bg-border text-text-secondary'
                  }`}>
                    {i + 1 < currentStep ? <FaCheck /> : i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-button mb-4">
            {error}
          </div>
        )}

        <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
          {renderStep()}

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 bg-surface border border-border text-text-primary rounded-button font-semibold hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
            >
              <FaArrowLeft className="mr-2" />
              Previous
            </button>
            {currentStep < totalSteps ? (
              <button
                type="submit"
                className="px-6 py-2 bg-accent text-text-light rounded-button font-semibold hover:bg-accent-hover transition flex items-center"
              >
                Next
                <FaArrowRight className="ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-accent text-text-light rounded-button font-semibold hover:bg-accent-hover disabled:opacity-50 transition"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default DriverRegistrationForm

