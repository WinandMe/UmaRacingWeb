# Fly.io Deployment Guide for Uma Racing Backend

## Step 1: Install Flyctl CLI
Download from: https://fly.io/docs/hands-on/install-flyctl/

For Windows (PowerShell):
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

## Step 2: Sign Up (No Credit Card Required)
```bash
flyctl auth signup
```
- Choose email signup
- Verify email
- Done!

## Step 3: Deploy Backend
```bash
cd UmaRacingWeb/backend
flyctl launch

# When prompted:
# - App name: uma-racing-backend (or your choice)
# - Region: iad (or closest to you)
# - PostgreSQL: No (we're using SQLite for now)
# - Redis: No

flyctl deploy
```

## Step 4: Get Your Backend URL
```bash
flyctl status
```
Output will show: `https://uma-racing-backend.fly.dev`

## Step 5: Update Frontend API URL
In your frontend files, change:
```javascript
const API_BASE = "https://uma-racing-backend.fly.dev/api";
```

## Step 6: Set Environment Variables (if needed)
```bash
flyctl secrets set SECRET_KEY=your-secret-key-here
flyctl secrets set ENVIRONMENT=production
```

## Useful Commands
```bash
flyctl logs              # View live logs
flyctl status            # Check app status
flyctl scale count=1     # Ensure 1 machine running (free tier)
flyctl deploy            # Redeploy after code changes
flyctl destroy           # Delete the app (if you change your mind)
```

## Troubleshooting
- If port error: Dockerfile uses port 8080 ✓
- If import error: Check requirements.txt is complete ✓
- If CORS error: Update allowed_origins in main.py ✓

## Notes
- Free tier: Always-on, no sleep timeouts ✓
- Bandwidth: Generous free limits
- Storage: Uses SQLite database in container (data resets on deploy)
  - To persist: Migrate to Fly Postgres ($5/month) or external DB
