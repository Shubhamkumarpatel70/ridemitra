import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import DriverDashboard from './pages/DriverDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Home from './pages/Home'
import DriverRegistrationForm from './components/driver/DriverRegistrationForm'
import VKYCSchedule from './pages/VKYCSchedule'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/user/*"
            element={
              <PrivateRoute allowedRoles={['user']}>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/driver/register"
            element={
              <PrivateRoute allowedRoles={['driver']}>
                <DriverRegistrationForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/driver/vkyc-schedule"
            element={
              <PrivateRoute allowedRoles={['driver']}>
                <VKYCSchedule />
              </PrivateRoute>
            }
          />
          <Route
            path="/driver/*"
            element={
              <PrivateRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

