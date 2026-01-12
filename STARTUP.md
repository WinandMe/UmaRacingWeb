# 🏇 Uma Racing Web - Startup Guide

## Quick Start (5 minutes)

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Backend Server
```bash
cd backend
python main.py
```

You should see:
```
============================================================
🏇 Uma Racing Web - Starting Backend Server
============================================================

📋 API Server:     http://localhost:8000
📚 API Docs:       http://localhost:8000/docs
🎨 Frontend:       http://localhost:5500 (if using Live Server)

============================================================
🏇 Uma Racing Web - Backend Starting...
============================================================
✓ Database initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Open the Frontend
The frontend is static HTML (no build step needed).

**Option A: Using VS Code Live Server (Recommended)**
1. Install the "Live Server" extension in VS Code
2. Right-click on `frontend/register.html`
3. Select "Open with Live Server"
4. Frontend will open at `http://localhost:5500`

**Option B: Using Python's built-in server**
```bash
cd frontend
python -m http.server 5500
```

**Option C: Direct browser**
- Open `frontend/register.html` directly in your browser
- Note: APIs require backend running at `http://localhost:8000`

## Complete Setup

### Prerequisites
- Python 3.8+ ([Download](https://www.python.org/downloads/))
- A modern web browser (Chrome, Firefox, Edge)
- Optional: VS Code with "Live Server" extension

### Step-by-Step Instructions

#### 1. Clone/Open the Project
```bash
cd "d:\Personal Project\UmaRacingWeb"
```

#### 2. Create Virtual Environment (Optional but Recommended)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

The `requirements.txt` includes:
- **FastAPI** - REST API framework
- **SQLAlchemy** - Database ORM
- **python-jose** - JWT token handling
- **passlib** - Password hashing with bcrypt
- **uvicorn** - ASGI server

#### 4. Start Backend Server
```bash
python main.py
```

**Expected output:**
```
============================================================
🏇 Uma Racing Web - Starting Backend Server
============================================================

📋 API Server:     http://localhost:8000
📚 API Docs:       http://localhost:8000/docs
🎨 Frontend:       http://localhost:5500 (if using Live Server)

============================================================
🏇 Uma Racing Web - Backend Starting...
============================================================
✓ Database initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

#### 5. Start Frontend
Open another terminal/command prompt:

**Using Live Server (Recommended):**
1. In VS Code, navigate to `frontend/register.html`
2. Right-click → "Open with Live Server"
3. Browser opens automatically at `http://localhost:5500`

**Using Python server:**
```bash
cd frontend
python -m http.server 5500
# Open http://localhost:5500 in browser
```

#### 6. Access the Application

| Component | URL |
|-----------|-----|
| Frontend (Register/Login) | http://localhost:5500 |
| API Server | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| Interactive API (Swagger) | http://localhost:8000/docs |

## Demo Login Credentials

**Trainee Account:**
- Username: `trainee_demo`
- Password: `password123`
- Role: Trainee (provide stats for your Uma Musume)

**Trainer Account:**
- Username: `trainer_demo`
- Password: `password123`
- Role: Trainer (manage and submit stats for trainees)

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Role: Admin (user management, overrides, audit logs)

*Note: These demo accounts are created automatically on first database initialization.*

## Architecture

### Backend Structure
```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── app/
│   ├── db.py              # Database connection & initialization
│   ├── models/
│   │   ├── database.py    # SQLAlchemy ORM models
│   │   ├── user.py        # Authentication models
│   │   └── race.py        # Racing models
│   ├── routes/
│   │   ├── auth.py        # Login/register endpoints
│   │   ├── stats.py       # Stat submission endpoints
│   │   ├── races.py       # Race management
│   │   ├── chat.py        # Public chat
│   │   ├── friends.py     # Friend system
│   │   ├── dms.py         # Direct messages
│   │   └── admin.py       # Admin panel
│   └── services/
│       ├── auth_service.py   # JWT & password hashing
│       └── stat_validator.py # Stat validation rules
└── skills.py              # Skill database
```

### Frontend Structure
```
frontend/
├── register.html          # User registration page
├── login.html             # User login page
├── dashboard.html         # Main dashboard (stats, history)
└── admin-dashboard.html   # Admin panel
```

### Database
- **Type:** SQLite (development) → PostgreSQL (production)
- **Location:** `uma_racing.db` (created automatically)
- **Tables:** Users, Trainees, Stats, Races, Chat, Friends, DMs

## Key Features

### Authentication
- JWT token-based authentication
- Role-based access control (Trainee/Trainer/Admin)
- Bcrypt password hashing
- Token expiration: 24 hours

### Stat System (Input-Only)
- Stats are immutable once submitted
- Spreadsheet-driven validation (0-9999 per stat)
- Required stats: Speed, Stamina, Power, Guts, Wit
- Admin can override any stat
- Full audit trail of submissions

### Racing
- Race creation with multiple categories
- Stat snapshots at race entry time
- Support for G1, G2, G3, and International races
- WebSocket for real-time race updates

### Social Features
- Public chat with admin moderation
- Friend requests with accept/reject
- Direct messaging between users
- User blocking

### Admin Tools
- User management (ban/unban)
- Stat overrides with audit logging
- Chat moderation
- Audit log viewing

## Troubleshooting

### Port Already in Use
If port 8000 is already in use:
```bash
python main.py --port 8001
```

### Database Issues
If the database is corrupted, delete it and restart:
```bash
rm uma_racing.db  # Linux/Mac
del uma_racing.db  # Windows
python main.py    # Recreates database
```

### Import Errors
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt --upgrade
```

### CORS Errors
If frontend can't reach backend:
- Verify backend is running at `http://localhost:8000`
- Check browser console for error messages
- Ensure frontend is accessing correct API URLs

### Database Connection Issues
```bash
# Check if database initialization failed in startup logs
# The logs should show: "✓ Database initialized successfully"
# If not, check backend console for error messages
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Stats
- `POST /api/stats/submit` - Submit trainee stats
- `GET /api/stats/{trainee_id}` - Get latest stats
- `GET /api/stats/{trainee_id}/history` - Get submission history

### Races
- `POST /api/races/create` - Create a new race
- `POST /api/races/{race_id}/enter` - Enter trainee in race
- `GET /api/races/{race_id}` - Get race details
- `GET /api/races/` - List all available races

### Social
- `POST /api/friends/request/{friend_id}` - Send friend request
- `POST /api/friends/accept/{friendship_id}` - Accept request
- `GET /api/friends/list` - Get friends list
- `POST /api/chat/send` - Send public message
- `POST /api/dms/send` - Send direct message

### Admin
- `POST /api/admin/users/ban` - Ban a user
- `POST /api/admin/stats/override` - Override stat (admin only)
- `GET /api/admin/audit-log` - View audit log

## Environment Variables

Create a `.env` file in the `backend/` directory (optional):
```
DATABASE_URL=sqlite:///uma_racing.db
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Development vs Production

### Development (Current Setup)
- SQLite database
- CORS allows `*` (any origin)
- Debug mode enabled
- Demo accounts auto-created

### Production Deployment
1. Change database to PostgreSQL
2. Update CORS origins to specific domains
3. Use environment variables for secrets
4. Set `debug=false` in FastAPI
5. Use a production ASGI server (Gunicorn, etc.)

## Support & Troubleshooting

### Check Logs
**Backend logs** appear in the terminal where you ran `python main.py`:
- Look for `✓` symbols (success)
- Look for `✗` symbols (errors)
- HTTP endpoints logged with `INFO:` prefix

**Frontend logs** appear in browser Developer Tools (F12):
- Console tab shows JavaScript errors
- Network tab shows API requests/responses

### Common Issues

| Issue | Solution |
|-------|----------|
| "Address already in use" | Change port or kill process using 8000 |
| "ModuleNotFoundError" | Run `pip install -r requirements.txt` |
| "No module named 'app'" | Ensure you're in `backend/` directory |
| "CORS error in browser" | Verify backend is running and accessible |
| "Database locked" | Close other connections to database |
| "401 Unauthorized" | Check that JWT token is in Authorization header |

## Next Steps

1. **Register** a new account on `http://localhost:5500/register.html`
2. **Choose role:** Trainee (submit stats) or Trainer (manage trainees)
3. **Login** with your credentials
4. **Submit stats** in the dashboard
5. **Create a race** and enter your trainees
6. **Chat** with other players

Enjoy! 🏇

