# 🚀 Deployment Guide

This guide will help you deploy the Imposter Game so anyone can play it online.

## Quick Deploy Options

### Option 1: Render (Recommended - Free & Easy)

Render offers free hosting for both frontend and backend.

#### Backend Deployment (FastAPI)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `Nkwon08/IMPOSTER`
4. Configure:
   - **Name**: `imposter-game-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**: None needed for basic setup
5. Click "Create Web Service"
6. Copy your backend URL (e.g., `https://imposter-game-backend.onrender.com`)

#### Frontend Deployment (React)

1. In Render, click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `imposter-game-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Important**: Add environment variable:
   - `VITE_API_URL` = your backend URL (e.g., `https://imposter-game-backend.onrender.com`)
5. Update `frontend/vite.config.js` to use the environment variable for API calls

### Option 2: Railway (Simple & Fast)

#### Backend
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a service → Select `backend` folder
5. Railway auto-detects Python
6. Add environment variable: `PORT` (Railway sets this automatically)
7. Deploy!

#### Frontend
1. Add another service → Select `frontend` folder
2. Railway auto-detects Node.js
3. Add environment variable: `VITE_API_URL` = your backend URL
4. Deploy!

### Option 3: Vercel (Frontend) + Render (Backend)

#### Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Add `VITE_API_URL` = your backend URL
5. Deploy!

#### Backend on Render
Follow the Render backend instructions above.

## Required Code Changes

### Update Frontend to Use Environment Variable

Update `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
```

Update `frontend/src/hooks/useWebSocket.js`:

```javascript
// Replace the WebSocket URL construction
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const apiUrl = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8000' : window.location.origin)
const wsUrl = apiUrl.replace('http', 'ws').replace('https', 'wss') + `/ws/${roomCode}`
```

Update API calls in frontend to use environment variable:

```javascript
const API_URL = import.meta.env.VITE_API_URL || ''
const res = await fetch(`${API_URL}/api/create_room`, { ... })
```

### Update Backend CORS

Update `backend/main.py` to allow your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://your-frontend-domain.vercel.app",  # Add your frontend URL
        "https://your-frontend-domain.onrender.com",  # Add your frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Or for production, you might want to use environment variables:

```python
import os

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# Add frontend URL from environment variable
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step-by-Step: Render Deployment

### 1. Prepare Your Code

Make sure all changes are committed and pushed to GitHub.

### 2. Deploy Backend

1. Visit [render.com](https://render.com)
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect repository: `Nkwon08/IMPOSTER`
5. Settings:
   - **Name**: `imposter-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy the URL (e.g., `https://imposter-backend.onrender.com`)

### 3. Deploy Frontend

1. In Render, click "New +" → "Static Site"
2. Connect repository: `Nkwon08/IMPOSTER`
3. Settings:
   - **Name**: `imposter-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Environment Variables:
   - Key: `VITE_API_URL`
   - Value: `https://imposter-backend.onrender.com` (your backend URL)
5. Click "Create Static Site"
6. Wait for deployment
7. Your site will be live at: `https://imposter-frontend.onrender.com`

### 4. Update Backend CORS

1. Go to your backend service in Render
2. Add Environment Variable:
   - Key: `FRONTEND_URL`
   - Value: `https://imposter-frontend.onrender.com`
3. Update `backend/main.py` to read this environment variable (see code above)
4. Redeploy backend

## Custom Domain (Optional)

Both Render and Vercel allow you to add custom domains:

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Follow DNS configuration instructions

## Troubleshooting

### Backend Issues
- **Port**: Make sure backend uses `$PORT` environment variable (Render/Railway provide this)
- **CORS**: Ensure frontend URL is in allowed origins
- **WebSockets**: Some free tiers have WebSocket limitations

### Frontend Issues
- **API Calls**: Check that `VITE_API_URL` is set correctly
- **Build Errors**: Make sure all dependencies are in `package.json`
- **WebSocket**: Update WebSocket URL to use environment variable

### WebSocket Issues
- Free tiers on some platforms may not support WebSockets well
- Consider using polling as fallback
- Or upgrade to a paid plan

## Alternative: Single Platform Deployment

### Fly.io (Supports Both)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Deploy backend:
   ```bash
   cd backend
   fly launch
   fly deploy
   ```
3. Deploy frontend:
   ```bash
   cd frontend
   fly launch
   fly deploy
   ```

## Cost Comparison

- **Render**: Free tier (spins down after inactivity)
- **Railway**: $5/month after free trial
- **Vercel**: Free for frontend
- **Fly.io**: Free tier available
- **Heroku**: No longer free

## Recommended Setup

For easiest deployment:
1. **Backend**: Render (free, easy setup)
2. **Frontend**: Vercel (free, fast, great for React)

This gives you a fully functional, free deployment!

