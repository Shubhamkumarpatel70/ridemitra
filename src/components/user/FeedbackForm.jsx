import { useState } from 'react'
import axios from 'axios'
import { FaStar } from 'react-icons/fa'

const FeedbackForm = ({ ride, onSubmitted }) => {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')
    try {
      await axios.put(`/api/rides/${ride._id}/rate`, {
        rating,
        review: review.trim()
      })
      if (onSubmitted) {
        onSubmitted()
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-button p-6 mb-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">Rate Your Ride</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Rating
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <FaStar
                  className={`text-3xl ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400'
                      : 'text-text-secondary'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-text-primary font-semibold">
                {rating} {rating === 1 ? 'star' : 'stars'}
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Review (Optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-surface border border-border rounded-button text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Share your experience..."
            maxLength={500}
          />
          <div className="text-xs text-text-secondary mt-1 text-right">
            {review.length}/500
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-danger">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || rating === 0}
          className="w-full bg-accent text-text-light py-3 rounded-button font-semibold hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  )
}

export default FeedbackForm

