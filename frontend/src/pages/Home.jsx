import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  FaCar, 
  FaMotorcycle, 
  FaRocket, 
  FaShieldAlt, 
  FaClock, 
  FaRupeeSign, 
  FaMapMarkerAlt,
  FaUserCheck,
  FaStar,
  FaWallet,
  FaCreditCard,
  FaCheckCircle,
  FaPhone,
  FaEnvelope,
  FaFacebook,
  FaTwitter,
  FaInstagram
} from 'react-icons/fa'

const Home = () => {
  const { user, isAuthenticated } = useAuth()

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login'
    if (user.role === 'admin') return '/admin'
    if (user.role === 'driver') return '/driver'
    return '/user'
  }

  return (
    <div className="min-h-screen bg-secondary">
      <nav className="bg-surface border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FaRocket className="text-accent text-2xl mr-2" />
              <span className="text-xl font-bold text-text-primary">Ride Mitra</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to={getDashboardLink()}
                  className="bg-accent text-text-light px-4 py-2 rounded-button font-semibold hover:bg-accent-hover transition"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-text-secondary hover:text-accent px-4 py-2 rounded-button transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-accent text-text-light px-4 py-2 rounded-button font-semibold hover:bg-accent-hover transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6">
            Book Your Ride in Minutes
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Fast, reliable, and affordable rides at your fingertips. Choose from Bike, Auto, or Car - we've got you covered!
          </p>
          {!isAuthenticated && (
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="bg-accent text-text-light px-8 py-3 rounded-button text-lg font-semibold hover:bg-accent-hover transition inline-block"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="bg-surface border border-border text-text-primary px-8 py-3 rounded-button text-lg font-semibold hover:bg-secondary transition inline-block"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Vehicle Types */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-surface border border-border rounded-button p-6 hover:border-accent transition">
            <FaMotorcycle className="text-accent text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Bike</h3>
            <p className="text-text-secondary mb-4">Quick and affordable rides for short distances</p>
            <div className="text-sm text-accent font-semibold">Starting from ₹20</div>
          </div>
          <div className="bg-surface border border-border rounded-button p-6 hover:border-accent transition">
            <FaCar className="text-accent text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Auto</h3>
            <p className="text-text-secondary mb-4">Comfortable three-wheeler rides</p>
            <div className="text-sm text-accent font-semibold">Starting from ₹30</div>
          </div>
          <div className="bg-surface border border-border rounded-button p-6 hover:border-accent transition">
            <FaCar className="text-accent text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Car</h3>
            <p className="text-text-secondary mb-4">Premium rides with maximum comfort</p>
            <div className="text-sm text-accent font-semibold">Starting from ₹50</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-surface border-t border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-12">Why Choose Ride Mitra?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-accent text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Safe & Secure</h3>
              <p className="text-text-secondary">Verified drivers and secure payment options</p>
            </div>
            <div className="text-center">
              <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaClock className="text-accent text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Quick Booking</h3>
              <p className="text-text-secondary">Book your ride in just a few taps</p>
            </div>
            <div className="text-center">
              <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaRupeeSign className="text-accent text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Affordable Prices</h3>
              <p className="text-text-secondary">Transparent pricing with no hidden charges</p>
            </div>
            <div className="text-center">
              <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-accent text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Real-time Tracking</h3>
              <p className="text-text-secondary">Track your ride in real-time</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent text-text-light rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Sign Up</h3>
              <p className="text-text-secondary">Create your account in seconds</p>
            </div>
            <div className="text-center">
              <div className="bg-accent text-text-light rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Book a Ride</h3>
              <p className="text-text-secondary">Enter pickup and dropoff locations</p>
            </div>
            <div className="text-center">
              <div className="bg-accent text-text-light rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Get Matched</h3>
              <p className="text-text-secondary">Nearby driver accepts your ride</p>
            </div>
            <div className="text-center">
              <div className="bg-accent text-text-light rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Enjoy Your Ride</h3>
              <p className="text-text-secondary">Safe and comfortable journey to your destination</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="bg-surface border-t border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-12">Flexible Payment Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-secondary border border-border rounded-button p-6 text-center">
              <FaWallet className="text-accent text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">Wallet</h3>
              <p className="text-text-secondary">Pay using your wallet balance for quick transactions</p>
            </div>
            <div className="bg-secondary border border-border rounded-button p-6 text-center">
              <FaCreditCard className="text-accent text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">Online Payment</h3>
              <p className="text-text-secondary">Secure online payment with cards or UPI</p>
            </div>
            <div className="bg-secondary border border-border rounded-button p-6 text-center">
              <FaRupeeSign className="text-accent text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">Cash</h3>
              <p className="text-text-secondary">Pay directly to the driver after your ride</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits for Drivers */}
      <div className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-12">Drive with Ride Mitra</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-surface border border-border rounded-button p-6">
              <h3 className="text-2xl font-semibold text-text-primary mb-4">Earn on Your Schedule</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaCheckCircle className="text-accent mr-3 mt-1 flex-shrink-0" />
                  <span className="text-text-secondary">Flexible working hours - drive when you want</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-accent mr-3 mt-1 flex-shrink-0" />
                  <span className="text-text-secondary">Competitive earnings with transparent pricing</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-accent mr-3 mt-1 flex-shrink-0" />
                  <span className="text-text-secondary">Weekly payouts directly to your account</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-accent mr-3 mt-1 flex-shrink-0" />
                  <span className="text-text-secondary">Support and assistance whenever you need</span>
                </li>
              </ul>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="mt-6 bg-accent text-text-light px-6 py-3 rounded-button font-semibold hover:bg-accent-hover transition inline-block"
                >
                  Become a Driver
                </Link>
              )}
            </div>
            <div className="bg-surface border border-border rounded-button p-6">
              <h3 className="text-2xl font-semibold text-text-primary mb-4">Why Drivers Love Us</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaStar className="text-yellow-400 mr-2" />
                  <span className="text-text-primary font-semibold">4.8/5 Average Rating</span>
                </div>
                <div className="flex items-center">
                  <FaUserCheck className="text-accent mr-2" />
                  <span className="text-text-primary font-semibold">Verified Riders Only</span>
                </div>
                <div className="flex items-center">
                  <FaShieldAlt className="text-accent mr-2" />
                  <span className="text-text-primary font-semibold">Insurance Coverage</span>
                </div>
                <div className="flex items-center">
                  <FaClock className="text-accent mr-2" />
                  <span className="text-text-primary font-semibold">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-accent/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-accent mb-2">10K+</div>
              <div className="text-text-secondary">Happy Riders</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">5K+</div>
              <div className="text-text-secondary">Verified Drivers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">50K+</div>
              <div className="text-text-secondary">Rides Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">4.8★</div>
              <div className="text-text-secondary">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <FaRocket className="text-accent text-2xl mr-2" />
                <span className="text-xl font-bold text-text-primary">Ride Mitra</span>
              </div>
              <p className="text-text-secondary mb-4">
                Your trusted partner for safe and reliable rides. Book your journey with us today!
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-text-secondary hover:text-accent transition">
                  <FaFacebook className="text-xl" />
                </a>
                <a href="#" className="text-text-secondary hover:text-accent transition">
                  <FaTwitter className="text-xl" />
                </a>
                <a href="#" className="text-text-secondary hover:text-accent transition">
                  <FaInstagram className="text-xl" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-text-secondary hover:text-accent transition">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-text-secondary hover:text-accent transition">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-text-secondary hover:text-accent transition">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-4">Services</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>Bike Rides</li>
                <li>Auto Rides</li>
                <li>Car Rides</li>
                <li>Become a Driver</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-4">Contact Us</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-text-secondary">
                  <FaPhone className="mr-2 text-accent" />
                  <span>+91 1234567890</span>
                </li>
                <li className="flex items-center text-text-secondary">
                  <FaEnvelope className="mr-2 text-accent" />
                  <span>support@ridemitra.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-text-secondary">
            <p>&copy; {new Date().getFullYear()} Ride Mitra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
