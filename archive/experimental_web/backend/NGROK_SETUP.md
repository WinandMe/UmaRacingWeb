# ngrok Setup Guide - Expose Local Backend Publicly

## Overview
**ngrok** creates a public HTTPS tunnel to your local backend running on `localhost:8000`.

**Perfect for:**
- Testing frontend ↔ backend integration
- Demos/sharing with others
- Development without deploying
- Zero cost, no credit card, instant

**Free tier limits:**
- 2-hour session timeout (restart to get new URL)
- 20 requests/minute limit
- Good enough for development

---

## Step 1: Download ngrok

**Windows:**
```powershell
# Using chocolatey
choco install ngrok

# OR download from: https://ngrok.com/download
```

**Verify installation:**
```powershell
ngrok --version
```

---

## Step 2: Sign Up (Optional but Recommended)

Go to: https://ngrok.com/

Sign up with email (takes 30 seconds, no card). This gives you:
- Longer session timeout
- More features
- Custom domains (paid)

After signup, you'll get an **auth token**:

```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

---

## Step 3: Start Your Local Backend

**Terminal 1 - Start Backend:**
```powershell
cd "d:\Personal Project\UmaRacingWeb\backend"

# Make sure you're in virtual environment if you have one
# python -m venv venv
# venv\Scripts\Activate.ps1

# Install dependencies (if not already)
pip install -r requirements.txt

# Start the backend
python -m uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

✅ **Backend is running locally**

---

## Step 4: Expose with ngrok

**Terminal 2 - Start ngrok tunnel:**
```powershell
ngrok http 8000
```

You'll see output like:
```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://abc-123-def.ngrok-free.app -> http://localhost:8000
Connections                   ttl    opn   rt1   rt5   p50   p95
                              0      0     0.00  0.00  0.00  0.00
```

✅ **Copy your ngrok URL:** `https://abc-123-def.ngrok-free.app`

---

## Step 5: Update Frontend API_BASE

Now update all your frontend files to use the ngrok URL:

**Option A: Edit each file**
In all frontend HTML files (messages.html, friends.html, races.html, etc.), change:
```javascript
const API_BASE = "http://localhost:5000/api";
// TO:
const API_BASE = "https://abc-123-def.ngrok-free.app/api";
```

**Option B: Use environment variable (better)**
Create a config file `frontend/config.js`:
```javascript
// config.js
export const API_BASE = "https://abc-123-def.ngrok-free.app/api";
```

Then in your HTML files:
```html
<script type="module">
  import { API_BASE } from './config.js';
  // Use API_BASE throughout your code
</script>
```

---

## Step 6: Test Integration

1. Open frontend: http://localhost:5500 (or your Vercel URL)
2. Try login or any API call
3. Check ngrok terminal for request logs
4. Check backend terminal for processing logs

If you see requests flowing through ngrok → Success! ✅

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Connection refused" | Make sure backend is running on port 8000 |
| CORS errors | Update `allowed_origins` in `backend/main.py` |
| 404 errors | Check your API_BASE URL is correct |
| ngrok keeps disconnecting | Sign up for free ngrok account + auth token |
| URL changes every 2 hours | This is expected on free tier. Just restart ngrok |

---

## Updating Frontend API URL Script

**Quick script to update all HTML files at once:**

```powershell
# PowerShell - in frontend folder
$ngrokUrl = "https://abc-123-def.ngrok-free.app"
$apiBase = "$ngrokUrl/api"

Get-ChildItem -Filter "*.html" | ForEach-Object {
    (Get-Content $_.FullName) -replace 'const API_BASE = "[^"]*api[^"]*";', "const API_BASE = `"$apiBase`";" | Set-Content $_.FullName
    Write-Host "Updated: $($_.Name)"
}
```

---

## Every 2 Hours (When URL Changes)

When your ngrok session expires:

```powershell
# Terminal 2 - Restart ngrok
ngrok http 8000
# Get new URL from output

# Update frontend files with new URL
# Refresh browser
```

You can automate this or upgrade to paid ($5/month) for persistent URL.

---

## Keep Backend Running 24/7 (Your Machine)

If you want your machine to serve the backend:

1. Keep ngrok + backend running in background
2. Use Windows Task Scheduler to auto-restart if crashed
3. Or use `pm2` (Node.js process manager, works with Python too):

```powershell
npm install -g pm2
pm2 start "python -m uvicorn main:app --port 8000" --name "uma-racing-backend"
pm2 save
```

---

## Upgrade Options (If You Want Persistent URL)

| Plan | Cost | Features |
|------|------|----------|
| Free | $0 | 2-hour sessions, limited requests |
| Pro | $5/month | 30-hour sessions, reserved domains |
| Business | $20/month | Always-on, custom domains, priority |

For now, free tier is fine for testing!

---

## Summary

1. ✅ Start backend locally: `uvicorn main:app --port 8000`
2. ✅ Start ngrok: `ngrok http 8000`
3. ✅ Copy ngrok URL
4. ✅ Update frontend `API_BASE`
5. ✅ Test your app
6. Every 2 hours: Repeat steps 2-4

**You're now live with zero hosting costs!** 🚀
