# Deta Space Quick Start (5 Minutes)

**Why Deta Space?**
✅ Always-on 24/7 (no sleeping!)  
✅ No credit card required  
✅ Free forever  
✅ Super easy setup  

---

## Step 1: Sign Up (1 min)
1. Go to https://deta.space
2. Click **"Start Building"**
3. Sign up with email or GitHub
4. Confirm email

---

## Step 2: Install Deta CLI (2 min)

### Windows (PowerShell):
```powershell
iwr https://get.deta.dev/cli.ps1 -useb | iex
```
Close and reopen PowerShell.

### Mac/Linux:
```bash
curl -fsSL https://get.deta.dev/cli.sh | sh
```

**Verify install:**
```bash
deta --version
```

---

## Step 3: Login to Deta (1 min)
```bash
deta login
```
Browser opens → Sign in → Copy auth token → Paste in terminal

---

## Step 4: Deploy Your Backend (1 min)

### Option A: From GitHub (Easiest)
```bash
cd d:\Personal Project\UmaRacingWeb
deta new --name uma-racing --git https://github.com/WinandMe/UmaRacingWeb
```

### Option B: From Local Folder
```bash
cd d:\Personal Project\UmaRacingWeb\backend
deta new --name uma-racing
```

**Wait ~2-3 minutes for deployment.**

---

## Step 5: Get Your URL

After deployment:
```bash
deta details
```

You'll see:
```
App URL: https://abc123.deta.dev
```

**Test it:**
```
https://abc123.deta.dev/docs
```
Should show FastAPI Swagger docs! ✅

---

## Step 6: Update Frontend

In Vercel, set environment variable:
```
API_BASE_URL = https://abc123.deta.dev/api
```

Redeploy Vercel (or it auto-redeploys on next push).

---

## Step 7: Test Everything!

Visit your Vercel frontend URL:
```
https://your-project.vercel.app
```

Try:
- Register new account ✓
- Login ✓
- Create race ✓
- Post on UmaLinkedIn ✓
- Like/comment posts ✓

---

## 🎉 You're Done!

**Your URLs:**
- **Backend**: `https://abc123.deta.dev`
- **Frontend**: `https://your-project.vercel.app`
- **API Docs**: `https://abc123.deta.dev/docs`
- **Cost**: $0/month forever
- **Uptime**: 24/7 always-on

---

## Update Your App

Push changes to GitHub:
```bash
git add .
git commit -m "Update features"
git push origin main
```

Deta auto-deploys on push! ✨

---

## Troubleshooting

### Error: "deta: command not found"
- Restart PowerShell/terminal after installing Deta CLI
- Add to PATH if needed

### Error: "Failed to get deployed app"
- Deta free tier deploys in <1 minute
- Wait a bit longer and retry

### 502 Bad Gateway
- Check error logs:
  ```bash
  deta visor
  ```
- View live logs of your app

### API calls fail
- Make sure `API_BASE_URL` is set in Vercel
- Verify backend URL in environment variable
- Check CORS in `backend/main.py` includes your Vercel URL

---

## Next Steps

1. ✅ Backend live on Deta Space
2. ✅ Frontend live on Vercel
3. **Share your app!**
   ```
   https://your-project.vercel.app
   ```
4. Tell friends to register and race! 🏇

---

## Alternative: Replit (if Deta has issues)

If Deta doesn't work:
1. https://replit.com → Create → Import from GitHub
2. Paste: `https://github.com/WinandMe/UmaRacingWeb`
3. Click **Run**
4. Gets URL automatically
5. Set in Vercel environment

Both are free forever! Pick whichever works. ✅
