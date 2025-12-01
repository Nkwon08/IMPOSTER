# 🔧 Troubleshooting Guide

## "Error creating game" Issue

If you're getting "Error creating game" when trying to create a game, check the following:

### 1. Check Environment Variables

#### Frontend (Render Static Site)
- Go to your frontend service → Environment tab
- Make sure `VITE_API_URL` is set to your backend URL
- Example: `https://your-backend-name.onrender.com`
- **Important**: No trailing slash!

#### Backend (Render Web Service)
- Go to your backend service → Environment tab
- Make sure `FRONTEND_URL` is set to your frontend URL
- Example: `https://imposter-game-rzsi.onrender.com`
- **Important**: No trailing slash!

### 2. Check Backend is Running

1. Visit your backend URL directly: `https://your-backend-name.onrender.com/docs`
2. You should see the FastAPI documentation page
3. If you see an error, the backend isn't running properly

### 3. Check CORS Configuration

The backend needs to allow your frontend URL. Check `backend/main.py`:

```python
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)
```

Make sure `FRONTEND_URL` environment variable is set in Render.

### 4. Check Browser Console

1. Open your frontend: https://imposter-game-rzsi.onrender.com
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try creating a game
5. Look for error messages - they will tell you what's wrong

Common errors:
- `Failed to fetch` - Backend URL is wrong or backend is down
- `CORS error` - Frontend URL not in backend's allowed origins
- `404 Not Found` - API endpoint path is wrong

### 5. Test Backend API Directly

Test if the backend is working:

```bash
curl -X POST https://your-backend-name.onrender.com/api/create_room \
  -H "Content-Type: application/json" \
  -d '{}'
```

You should get a response like:
```json
{"roomCode": "1234", "hostId": "..."}
```

If this fails, the backend has an issue.

### 6. Check Render Logs

#### Frontend Logs
1. Go to your frontend service in Render
2. Click "Logs" tab
3. Look for build errors or runtime errors

#### Backend Logs
1. Go to your backend service in Render
2. Click "Logs" tab
3. Look for:
   - Startup errors
   - Request errors
   - CORS errors

### 7. Common Issues & Solutions

#### Issue: "Failed to fetch"
**Solution**: 
- Check `VITE_API_URL` is set correctly
- Make sure backend is running (check `/docs` endpoint)
- Check backend URL doesn't have trailing slash

#### Issue: CORS Error
**Solution**:
- Add `FRONTEND_URL` environment variable to backend
- Make sure it matches your frontend URL exactly
- Redeploy backend after adding environment variable

#### Issue: 404 Not Found
**Solution**:
- Check API endpoint paths match (`/api/create_room`)
- Make sure backend is using correct route paths

#### Issue: Backend spins down (free tier)
**Solution**:
- Free tier on Render spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Consider upgrading or use a service that doesn't spin down

### 8. Quick Debug Steps

1. **Test backend directly**: Visit `https://your-backend.onrender.com/docs`
2. **Check environment variables**: Both services need their URLs set
3. **Check browser console**: Look for specific error messages
4. **Check Render logs**: See what's happening on the server
5. **Redeploy both**: Sometimes a fresh deploy fixes issues

### 9. Still Not Working?

If none of the above works:

1. Share the exact error message from browser console
2. Share your backend URL (you can redact part of it)
3. Check if backend `/docs` endpoint works
4. Verify both services show "Live" status in Render

