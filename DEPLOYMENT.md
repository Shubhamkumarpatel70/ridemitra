# Deployment Guide for Ride Mitra

## Prerequisites
- GitHub account
- Render account (https://render.com)
- MongoDB Atlas account (or MongoDB instance)

## Step 1: Push to GitHub

1. Initialize git repository (if not already done):
```bash
git init
```

2. Add all files:
```bash
git add .
```

3. Commit:
```bash
git commit -m "Initial commit - Ride Mitra application"
```

4. Create a new repository on GitHub and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/ride-mitra.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend on Render

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: ride-mitra-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default)
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string

6. Click "Create Web Service"
7. Note the backend URL (e.g., `https://ride-mitra-backend.onrender.com`)

## Step 3: Deploy Frontend on Render

1. In Render dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: ride-mitra-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Root Directory**: `frontend`

4. Add Environment Variable:
   - `VITE_API_URL`: Your backend URL (e.g., `https://ride-mitra-backend.onrender.com`)

5. Update `frontend/vite.config.js` to use environment variable:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: import.meta.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

6. Update axios calls to use environment variable or update proxy settings

7. Click "Create Static Site"

## Step 4: Update Frontend API URLs

After deployment, update the frontend to use the production API URL. You can either:

### Option A: Use Environment Variables
Create `frontend/.env.production`:
```
VITE_API_URL=https://ride-mitra-backend.onrender.com
```

### Option B: Update axios baseURL
In your axios configuration, use:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
})
```

## Step 5: Update Image URLs

Update all image URLs in the frontend to use the production backend URL:
- Replace `http://localhost:5000` with your Render backend URL
- Or use environment variable: `import.meta.env.VITE_API_URL`

## Features Implemented

✅ Optional remark field in wallet addition
✅ Account details form in driver dashboard
✅ Withdrawal request functionality
✅ Wallet to Account tab in admin dashboard
✅ Transaction history with transaction IDs
✅ Account details display in Manage Drivers tab

## Notes

- Make sure MongoDB Atlas allows connections from Render IPs (0.0.0.0/0 for development)
- Update CORS settings in backend if needed
- Static files (uploads) will be served from Render backend
- Consider using a CDN for better performance

