import { useEffect, useState } from 'react'
import { FaMotorcycle, FaCar } from 'react-icons/fa'

const SplashScreen = ({ onComplete }) => {
  const [currentVehicle, setCurrentVehicle] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  
  const vehicles = [
    { icon: FaMotorcycle, name: 'Bike', color: 'text-accent-secondary', size: 'text-7xl' },
    { icon: FaCar, name: 'Auto', color: 'text-warning', size: 'text-6xl' },
    { icon: FaCar, name: 'Car', color: 'text-accent', size: 'text-7xl' }
  ]

  useEffect(() => {
    const vehicleInterval = setInterval(() => {
      setCurrentVehicle((prev) => {
        const next = (prev + 1) % vehicles.length
        return next
      })
    }, 1000) // Change vehicle every 1 second

    return () => clearInterval(vehicleInterval)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false)
      setTimeout(() => {
        onComplete()
      }, 300) // Small delay for fade out
    }, 3500) // 3.5 second splash screen to show all vehicles

    return () => clearTimeout(timer)
  }, [onComplete])

  const CurrentIcon = vehicles[currentVehicle].icon
  const currentVehicleData = vehicles[currentVehicle]

  return (
    <div 
      className={`fixed inset-0 bg-secondary flex items-center justify-center z-50 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        <div className="relative h-40 w-40 mx-auto mb-6 flex items-center justify-center">
          <div 
            key={currentVehicle}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              animation: 'vehicleSlideIn 0.6s ease-out'
            }}
          >
            <CurrentIcon 
              className={`${currentVehicleData.color} ${currentVehicleData.size} transition-all duration-300 transform`}
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }}
            />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-text-primary mb-2 animate-pulse">Ride Mitra</h1>
        <p className="text-text-secondary text-lg mb-2">Your ride, your way</p>
        <p className="text-accent font-semibold text-sm mb-4 capitalize">{currentVehicleData.name}</p>
        <div className="flex justify-center space-x-2 mt-6">
          {vehicles.map((vehicle, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === currentVehicle 
                  ? 'bg-accent w-8 scale-110' 
                  : 'bg-border w-2'
              }`}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes vehicleSlideIn {
          0% {
            opacity: 0;
            transform: translateX(-50px) scale(0.7) rotate(-10deg);
          }
          50% {
            transform: translateX(5px) scale(1.05) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  )
}

export default SplashScreen

