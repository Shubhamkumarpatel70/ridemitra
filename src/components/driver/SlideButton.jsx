import { useState } from 'react'
import { FaCheck } from 'react-icons/fa'

const SlideButton = ({ onSlide, label, disabled = false, loading = false }) => {
  const [isSliding, setIsSliding] = useState(false)
  const [slideProgress, setSlideProgress] = useState(0)

  const handleMouseDown = (e) => {
    if (disabled || loading) return
    setIsSliding(true)
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const startX = e.clientX

    const handleMouseMove = (e) => {
      const currentX = e.clientX
      const progress = Math.max(0, Math.min(100, ((currentX - startX) / rect.width) * 100))
      setSlideProgress(progress)
    }

    const handleMouseUp = () => {
      setIsSliding(false)
      if (slideProgress >= 80) {
        onSlide()
        setSlideProgress(0)
      } else {
        setSlideProgress(0)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        disabled={disabled || loading}
        className={`relative w-full h-14 bg-surface border-2 border-border rounded-button overflow-hidden transition-all ${
          disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
        } ${slideProgress >= 80 ? 'border-accent bg-accent/10' : ''}`}
      >
        <div
          className="absolute inset-0 bg-accent transition-all duration-300 flex items-center justify-end pr-4"
          style={{ width: `${slideProgress}%` }}
        >
          {slideProgress >= 80 && (
            <FaCheck className="text-white text-xl" />
          )}
        </div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <span className={`font-semibold transition-colors ${
            slideProgress >= 50 ? 'text-text-light' : 'text-text-primary'
          }`}>
            {loading ? 'Processing...' : label}
          </span>
        </div>
      </button>
      {slideProgress > 0 && slideProgress < 80 && (
        <p className="text-xs text-text-secondary mt-1 text-center">
          Slide to {label.toLowerCase()}
        </p>
      )}
    </div>
  )
}

export default SlideButton

