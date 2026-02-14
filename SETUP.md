# Setup Guide for Ride Mitra

## Quick Start

### 1. Install MongoDB
Make sure MongoDB is installed and running on your system.
- Download from: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ride-mitra
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
```

Start the frontend:
```bash
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Creating Admin User

To create an admin user, you can either:

1. Register through the UI and manually change the role in MongoDB:
```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

2. Or use the registration API directly with role='admin' (if you modify the backend to allow it)

## Testing the Application

1. **Register as User**: Create an account to book rides
2. **Register as Driver**: Create a driver account with vehicle details
3. **Login as Admin**: Use admin credentials to manage the platform

## Common Issues

### MongoDB Connection Error
- Make sure MongoDB is running
- Check the MONGODB_URI in `.env` file
- For MongoDB Atlas, use the connection string provided

### Port Already in Use
- Change the PORT in backend `.env` file
- Update the proxy in `frontend/vite.config.js` if you change the backend port

### CORS Errors
- Make sure backend is running before starting frontend
- Check that the proxy configuration in `vite.config.js` matches your backend port

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Use a strong `JWT_SECRET`
3. Update MongoDB URI to production database
4. Build frontend: `cd frontend && npm run build`
5. Serve the built files using a web server (nginx, Apache, etc.)

