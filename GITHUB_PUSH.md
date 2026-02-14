# GitHub Push Instructions

## Step 1: Initialize Git (if not already done)

```bash
git init
```

## Step 2: Add All Files

```bash
git add .
```

## Step 3: Create Initial Commit

```bash
git commit -m "Initial commit - Ride Mitra with wallet, account details, and withdrawal features"
```

## Step 4: Create GitHub Repository

1. Go to https://github.com
2. Click "New" to create a new repository
3. Name it: `ride-mitra` (or your preferred name)
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 5: Add Remote and Push

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/ride-mitra.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 6: Deploy on Render

Follow the instructions in `DEPLOYMENT.md` file.

## Environment Variables for Render

### Backend Environment Variables:
- `NODE_ENV`: `production`
- `PORT`: `5000` (or leave default)
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string (e.g., generate with: `openssl rand -base64 32`)

### Frontend Environment Variables:
- `VITE_API_URL`: Your backend Render URL (e.g., `https://ride-mitra-backend.onrender.com`)

## Notes

- Make sure `.env` files are in `.gitignore` (already added)
- Never commit sensitive data like JWT secrets or MongoDB URIs
- Use Render's environment variable settings for production secrets

