## 🚀 How to Start UmaRacingWeb

### **Quick Start (5 Steps)**

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the backend server
python main.py

# 4. In a NEW terminal, start the frontend server
cd frontend
python -m http.server 5500

# 5. Open in browser
# http://localhost:5500 → Frontend
# http://localhost:8000 → API Server
# http://localhost:8000/docs → API Documentation
```

### **Expected Output**

When you run `python main.py`, you should see:
```
============================================================
🏇 Uma Racing Web - Starting Backend Server
============================================================

📋 API Server:     http://localhost:8000
📚 API Docs:       http://localhost:8000/docs
🎨 Frontend:       http://localhost:5500

============================================================
✓ Database initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 📝 What Changed

### **requirements.txt** 
Updated with new dependencies for the multiplayer system:
- `SQLAlchemy==2.0.23` - Database ORM
- `python-jose[cryptography]==3.3.0` - JWT token handling
- `passlib[bcrypt]==1.7.4` - Password hashing

### **main.py**
Updated to:
- Import all route modules (auth, stats, races, chat, friends, dms, admin)
- Include `init_db()` for database initialization on startup
- Register all API routes automatically
- Display startup banner with URLs

### **STARTUP.md** (NEW)
Complete setup guide with:
- 5-minute quick start
- Architecture overview
- Environment setup instructions
- Troubleshooting guide
- Feature explanations
- Demo credentials

### **README.md**
Completely rewritten to reflect:
- New multiplayer architecture
- User authentication & roles
- Stat system design
- Social features
- API endpoints
- Tech stack documentation

---

## 🎮 Frontend Startup Options

### **Option 1: VS Code Live Server (Recommended)**
1. Install "Live Server" extension in VS Code
2. Right-click `frontend/register.html`
3. Select "Open with Live Server"
4. Browser opens automatically at `http://localhost:5500`

### **Option 2: Python HTTP Server**
```bash
cd frontend
python -m http.server 5500
# Then open http://localhost:5500 in browser
```

### **Option 3: Direct Browser**
- Open `frontend/register.html` directly in browser
- Note: Backend must be running at `http://localhost:8000`

---

## 🔑 Demo Accounts

Use these to test the application:

| Role | Username | Password |
|------|----------|----------|
| **Trainee** | trainee_demo | password123 |
| **Trainer** | trainer_demo | password123 |
| **Admin** | admin | admin123 |

---

## 📁 Key Files Updated

```
✓ backend/requirements.txt         → Added SQLAlchemy, JWT, Bcrypt
✓ backend/main.py                  → Added database init & route imports
✓ STARTUP.md                        → NEW (Complete setup guide)
✓ README.md                         → Rewritten (New architecture)
```

---

## ✅ Verification Checklist

After starting the application:

- [ ] Backend starts without errors
- [ ] See "✓ Database initialized successfully" message
- [ ] Frontend loads at http://localhost:5500
- [ ] Can register new account
- [ ] Can login with demo credentials
- [ ] API docs available at http://localhost:8000/docs

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview & quick start |
| [STARTUP.md](STARTUP.md) | Detailed setup & troubleshooting |
| [docs/STAT_SYSTEM.md](docs/STAT_SYSTEM.md) | Stat validation design |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Database structure |

---

## 🆘 Troubleshooting

### "Port already in use"
```bash
python main.py --port 8001
```

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt --upgrade
```

### "Database locked"
Delete `uma_racing.db` and restart:
```bash
rm uma_racing.db
python main.py
```

### "Cannot connect to backend"
- Verify `http://localhost:8000` is accessible
- Check browser console for CORS errors
- Ensure backend is still running

---

**That's it! You're ready to run UmaRacingWeb!** 🏇

For more details, see [STARTUP.md](STARTUP.md)
