# 📚 UmaRacingWeb - Complete Documentation Index

## 🚀 Getting Started (Start Here!)

| Document | Purpose | Best For |
|----------|---------|----------|
| [QUICKSTART_INSTRUCTIONS.md](QUICKSTART_INSTRUCTIONS.md) | **5-minute quick start** | First-time users wanting to run it immediately |
| [STARTUP.md](STARTUP.md) | **Comprehensive setup guide** (15+ pages) | Detailed setup, troubleshooting, and configuration |
| [README.md](README.md) | **Project overview** | Understanding the architecture and features |

## 🔧 Startup Methods

### Fastest (Windows)
```bash
Double-click: start_backend.bat
Double-click: start_frontend.bat (in new Command Prompt)
```

### Recommended (Command Line)
```bash
Terminal 1:  cd backend && python main.py
Terminal 2:  cd frontend && python -m http.server 5500
```

### Best for Development (VS Code)
1. `cd backend && python main.py`
2. Right-click `frontend/register.html` → "Open with Live Server"

**➡️ See [QUICKSTART_INSTRUCTIONS.md](QUICKSTART_INSTRUCTIONS.md) for more details**

---

## 📖 Technical Documentation

### Architecture & Design
- [README.md](README.md) - Project overview, tech stack, API endpoints
- [docs/STAT_SYSTEM.md](docs/STAT_SYSTEM.md) - Stat validation design and rules
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Complete database schema

### Configuration
- [backend/.env.example](backend/.env.example) - Environment variables template
- [backend/requirements.txt](backend/requirements.txt) - Python dependencies

---

## 🌐 Access Points

| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend** | http://localhost:5500 | User interface (register, login, dashboard) |
| **Backend API** | http://localhost:8000 | REST API endpoints |
| **API Documentation** | http://localhost:8000/docs | Interactive Swagger UI |
| **API Health** | http://localhost:8000/health | Server status check |

---

## 🔐 Demo Credentials

```
Trainee:   trainee_demo    / password123
Trainer:   trainer_demo    / password123
Admin:     admin           / admin123
```

(Created automatically on first database initialization)

---

## 📁 Key Files Structure

```
UmaRacingWeb/
├── 📄 README.md                     ← Project overview
├── 📄 STARTUP.md                    ← Detailed setup guide
├── 📄 QUICKSTART_INSTRUCTIONS.md    ← Quick reference
├── 🔧 start_backend.bat             ← Windows backend launcher
├── 🔧 start_frontend.bat            ← Windows frontend launcher
│
├── backend/
│   ├── main.py                      ← FastAPI application
│   ├── requirements.txt             ← Python dependencies
│   ├── .env.example                 ← Environment variables
│   ├── app/
│   │   ├── db.py                   ← Database setup
│   │   ├── models/                 ← ORM models
│   │   ├── services/               ← Business logic
│   │   └── routes/                 ← API endpoints
│   └── skills.py                   ← Skills database
│
├── frontend/
│   ├── register.html               ← Registration page
│   ├── login.html                  ← Login page
│   ├── dashboard.html              ← Main dashboard
│   └── admin-dashboard.html        ← Admin panel
│
└── docs/
    ├── STAT_SYSTEM.md             ← Stat validation design
    └── DATABASE_SCHEMA.md         ← Database documentation
```

---

## 🎯 Feature Documentation

### User Roles

**Trainee**
- Register and manage own Uma Musume
- Submit stats (Speed, Stamina, Power, Guts, Wit)
- Enter races with stats
- Chat and make friends

**Trainer**
- Create and manage multiple trainees
- Submit stats for owned trainees
- Enter trainees in races
- View stat history

**Admin**
- User management (ban/unban)
- Override stats when needed
- Moderate chat and DMs
- View complete audit logs

### Core Systems

1. **Authentication** - JWT tokens with 24-hour expiration
2. **Stat System** - Input-only, immutable once submitted
3. **Race Management** - Create races, manage entries with stat snapshots
4. **Social Features** - Chat, friends, direct messages
5. **Moderation** - Chat deletion, user banning, DM review
6. **Audit Trail** - Complete history of all actions

### API Endpoints

**Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
**Stats**: `/api/stats/submit`, `/api/stats/{trainee_id}`, `/api/stats/{trainee_id}/history`
**Races**: `/api/races/create`, `/api/races/{race_id}/enter`, `/api/races/`
**Social**: `/api/friends/request`, `/api/chat/send`, `/api/dms/send`
**Admin**: `/api/admin/users/ban`, `/api/admin/stats/override`, `/api/admin/audit-log`

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for full schema.

---

## 🔍 Troubleshooting

### Common Issues

**ModuleNotFoundError**
```bash
# Make sure you're in backend directory
cd backend
python main.py
```

**Port already in use**
```bash
python main.py --port 8001
```

**Database locked**
```bash
# Delete database and restart
rm uma_racing.db  # or delete manually
python main.py
```

**Frontend can't reach backend**
- Verify backend is running: http://localhost:8000/health
- Check browser console for errors (F12)
- Ensure CORS is not blocking requests

See [STARTUP.md](STARTUP.md) for more troubleshooting.

---

## 📝 Dependencies

**Backend** (Python):
- FastAPI - REST API framework
- SQLAlchemy - Database ORM
- JWT (python-jose) - Authentication
- Bcrypt (passlib) - Password hashing
- Uvicorn - ASGI server

**Frontend** (Browser):
- HTML5, CSS3, JavaScript ES6+
- localStorage - Token persistence
- Fetch API - HTTP requests

**Database**:
- SQLite (development)
- PostgreSQL ready for production

See [backend/requirements.txt](backend/requirements.txt) for full list.

---

## 🚀 Production Deployment

1. Change database to PostgreSQL
2. Generate secure JWT secret
3. Set specific CORS domains
4. Use environment variables (create `.env` file)
5. Use production ASGI server (Gunicorn, etc.)
6. Enable HTTPS
7. Set `debug=false`

See [STARTUP.md](STARTUP.md) for detailed deployment guide.

---

## 📊 Database

**Type**: SQLite (development) → PostgreSQL (production)
**Location**: `uma_racing.db` in project root
**Tables**: 11 (Users, Trainees, Stats, Races, Chat, Friends, DMs, etc.)
**Auto-seeding**: Demo accounts created on first startup
**Constraints**: Full referential integrity and validation

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete schema.

---

## 🎨 Frontend Pages

- **register.html** - User registration with role selection
- **login.html** - User login with JWT persistence
- **dashboard.html** - Main dashboard (stats, history, trainees)
- **admin-dashboard.html** - Admin controls (users, audit logs, overrides)

All pages:
- Responsive design (works on mobile)
- Real-time validation
- localStorage for token persistence
- Clean, modern UI

---

## ✨ What's New (vs. Original)

| Feature | Before | After |
|---------|--------|-------|
| Users | ❌ None | ✅ Full auth system |
| Database | ❌ No persistence | ✅ SQLite with 11 tables |
| Stat Management | ❌ Manual input | ✅ Validated, immutable |
| Social | ❌ None | ✅ Chat, friends, DMs |
| Admin Tools | ❌ None | ✅ Full moderation |
| API | ❌ Race only | ✅ 7 route modules |
| Audit Trail | ❌ None | ✅ Complete logging |

---

## 🆘 Need Help?

1. **Quick answers**: See [QUICKSTART_INSTRUCTIONS.md](QUICKSTART_INSTRUCTIONS.md)
2. **Detailed guide**: See [STARTUP.md](STARTUP.md)
3. **Technical details**: See respective docs in `/docs/`
4. **API reference**: Visit http://localhost:8000/docs (when running)

---

## 📜 License & Credits

- **License**: All rights reserved
- **Original**: UmaRacingProject
- **Game**: Uma Musume Pretty Derby by Cygames
- **Version**: 2.0.0 (Multiplayer)

---

**Last Updated**: January 2026  
**Status**: ✅ Ready to Run

🎉 **Everything is set up and documented! Start the servers and enjoy!** 🎉
