# Ride Mitra - Ride Sharing Application

A full-stack ride-sharing application similar to Ola, Uber, and Rapido, built with MERN stack (MongoDB, Express, React, Node.js) and styled with Tailwind CSS.

## Features

### User Dashboard
- Book rides (Bike, Auto, Car)
- View ride history
- Rate and review completed rides
- Profile management

### Driver Dashboard
- Accept pending rides
- Start and complete rides
- Toggle availability status
- View earnings and statistics
- Track ride history

### Admin Dashboard
- View dashboard statistics
- Manage users (view, delete)
- Manage drivers (verify, delete)
- View all rides
- Monitor platform analytics

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ride-mitra
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Choose Role**: Register as a User, Driver, or Admin
3. **User**: Book rides, view history, manage profile
4. **Driver**: Accept rides, manage availability, track earnings
5. **Admin**: Manage users, drivers, and view platform statistics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Rides
- `POST /api/rides` - Book a new ride
- `GET /api/rides` - Get ride history
- `GET /api/rides/:id` - Get single ride details
- `PUT /api/rides/:id/cancel` - Cancel a ride
- `PUT /api/rides/:id/rate` - Rate a completed ride

### Driver
- `GET /api/driver/profile` - Get driver profile
- `PUT /api/driver/profile` - Update driver profile
- `PUT /api/driver/availability` - Toggle availability
- `GET /api/driver/rides/pending` - Get pending rides
- `PUT /api/driver/rides/:id/accept` - Accept a ride
- `PUT /api/driver/rides/:id/start` - Start a ride
- `PUT /api/driver/rides/:id/complete` - Complete a ride
- `GET /api/driver/earnings` - Get driver earnings

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/drivers` - Get all drivers
- `PUT /api/admin/drivers/:id/verify` - Verify/unverify driver
- `DELETE /api/admin/users/:id` - Delete user
- `DELETE /api/admin/drivers/:id` - Delete driver
- `GET /api/admin/rides` - Get all rides
- `GET /api/admin/stats` - Get dashboard statistics

## Project Structure

```
ride-mitra/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Driver.js
│   │   └── Ride.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── rides.js
│   │   ├── driver.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── user/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── DriverDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Notes

- Make sure MongoDB is running before starting the backend server
- For production, update the JWT_SECRET in the `.env` file
- The application uses mock coordinates for ride booking. In production, integrate with Google Maps API for accurate location services

## License

MIT

