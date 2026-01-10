# Quick Start Guide

## Step 1: Start the Backend

```bash
cd d:\Personal Project\UmaRacingWeb\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Wait for: `Uvicorn running on http://127.0.0.1:8000`

## Step 2: Start the Frontend (in a new terminal)

```bash
cd d:\Personal Project\UmaRacingWeb\frontend
npm install
npm start
```

Wait for: `compiled successfully` and browser opens to http://localhost:3000

## Step 3: Test with Sample Race

1. On the **Config Loader** page, click "Choose Race File"
2. Navigate to: `d:\Personal Project\UmaRacingProject\src\NakayamaKimpai.json`
3. Click "Start Race"
4. Watch the simulation run
5. Click participant names to view detailed stats + Tazuna's Advice

## Quick Verification

### Backend API (in browser or curl):
```
http://localhost:8000/docs
```

### Check Backend Health:
```bash
curl http://localhost:8000/api/health
```

### Check WebSocket:
- Open browser DevTools (F12)
- Navigate to Network tab
- Look for "ws" connections when race starts
- Should show messages flowing in real-time

## Troubleshooting

**"Connection refused" on port 8000:**
- Backend may not be running
- Check if another app is using port 8000
- Try: `netstat -ano | findstr :8000`

**"Cannot find module" in npm:**
- Delete `node_modules` folder
- Run `npm install` again

**"CORS error" in browser:**
- Frontend and backend have CORS mismatch
- Verify backend is running on localhost:8000
- Check `main.py` CORSMiddleware settings

**WebSocket disconnects:**
- Backend crashed (check terminal)
- Network issue (try refreshing page)
- Client ID mismatch (browser DevTools Network tab)

## File Structure

```
d:\Personal Project\UmaRacingWeb\
├── backend/
│   ├── requirements.txt
│   ├── main.py
│   ├── app/
│   │   ├── models/race.py
│   │   └── services/race_service.py
│   └── venv/  # Created after pip install
├── frontend/
│   ├── package.json
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   └── ...
│   └── node_modules/  # Created after npm install
└── README.md
```

## Next Steps

1. ✅ Start backend & frontend
2. ✅ Run a test race with sample JSON
3. ⬜ Modify colors in `frontend/src/tailwind.config.js`
4. ⬜ Add custom race configurations
5. ⬜ Deploy to production

## Performance Tips

- Use **5x or 10x speed** for testing multiple races
- Close other browser tabs
- Disable browser extensions
- Check GPU acceleration enabled

## Key Differences from Desktop Version

| Feature | Desktop | Web |
|---------|---------|-----|
| Installation | Standalone EXE | pip + npm |
| Runtime | Monolithic | Backend + Frontend |
| Updates | Manual re-download | Git pull |
| Customization | Limited | Flexible CSS/React |
| Deployment | Windows only | Any platform |
| Animations | Canvas painter | Framer Motion |

