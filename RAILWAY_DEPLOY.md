# Railway.app Deployment Guide

## ✅ Fixed Nixpacks Issue

I've created Railway-specific configuration files to fix the build failure:

- `Dockerfile` - Single container with frontend + backend
- `railway.json` - Railway configuration
- `railway-startup.sh` - Combined startup script
- `railway-nginx.conf` - Nginx configuration for routing

## 🚀 Deploy Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Deploy on Railway
1. Go to [Railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the Dockerfile and build

### 3. Add Database
1. In your Railway project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway will automatically create a `DATABASE_URL` environment variable

### 4. Configure Environment Variables
In Railway dashboard, add these variables:
```
SECRET_KEY=your-32-character-secret-key-here
CORS_ORIGINS_STR=https://your-app-name.railway.app
```

### 5. Your App is Live! 🎉
Railway will provide you with a URL like: `https://your-app-name.railway.app`

## 🔧 Configuration Details

### Single Container Setup
The new Dockerfile combines:
- React frontend (built and served by Nginx)
- FastAPI backend (running on port 8000)
- Nginx proxy (routes `/api/` to backend, everything else to frontend)

### Environment Variables
- `DATABASE_URL` - Automatically set by Railway PostgreSQL
- `PORT` - Automatically set by Railway
- `SECRET_KEY` - Set this manually (32+ characters)
- `CORS_ORIGINS_STR` - Set to your Railway app URL

### URL Structure
- Frontend: `https://your-app.railway.app/`
- API: `https://your-app.railway.app/api/v1/`
- Docs: `https://your-app.railway.app/docs`

## 🛠 Troubleshooting

### Build Fails
- Check the build logs in Railway dashboard
- Ensure all files are committed to Git

### Database Connection Issues
- Verify PostgreSQL service is running in Railway
- Check `DATABASE_URL` environment variable is set

### CORS Errors
- Set `CORS_ORIGINS_STR` to your Railway app URL
- Don't include trailing slash

### 404 Errors
- Check nginx configuration in container logs
- Verify API routes are accessible at `/api/v1/`

## 🔄 Updates
To update your app:
1. Make changes to your code
2. Commit and push to GitHub
3. Railway automatically rebuilds and deploys

## 💰 Cost
Railway free tier includes:
- $5 free credits monthly
- Automatic scaling
- Free PostgreSQL database
- Custom domains

This app should run well within free limits for development/testing.