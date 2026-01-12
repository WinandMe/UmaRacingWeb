#  UmaRacingWeb

A modern web-based **persistent multiplayer racing simulator** for Uma Musume Pretty Derby with user authentication, stat management, racing, and social features.

##  Features

### Core Racing System
- ** Real-time Race Simulation**: Watch races unfold with WebSocket-powered updates
- ** Complete Race Database**: 169+ races across G1, G2, G3, and International categories
- ** Race Analytics**: Detailed results, participant stats, and performance tracking

### User & Stat Management
- ** User Roles**: Trainee (submit stats), Trainer (manage trainees), Admin (system control)
- ** Input-Only Stat System**: Stats are immutable spreadsheet-driven inputs (no grinding/decay)
- ** Validation**: Automatic stat validation with optional admin override
- ** Audit Trail**: Complete history of all stat submissions and admin actions

### Social Features
- ** Public Chat**: Real-time messaging with admin moderation
- ** Friends System**: Send/accept friend requests with blocking capability
- ** Direct Messages**: Private conversations with admin oversight
- ** Moderation**: Chat deletion, user banning, and content review

### Admin Tools
- ** User Management**: Ban/unban users with audit logging
- ** Stat Overrides**: Override any stat for special cases
- ** Audit Log**: Full visibility into all system actions
- ** Content Review**: View conversations and user activity

##  Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start Backend Server
```bash
python main.py
```

Expected output:
```
============================================================
 Uma Racing Web - Starting Backend Server
============================================================

 API Server:     http://localhost:8000
 API Docs:       http://localhost:8000/docs
 Frontend:       http://localhost:5500 (if using Live Server)

============================================================
 Database initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Start Frontend (New Terminal)
**Option A: Using VS Code Live Server (Recommended)**
- Right-click `frontend/register.html`  "Open with Live Server"

**Option B: Python HTTP Server**
```bash
cd frontend
python -m http.server 5500
```

### 4. Access Application
| Component | URL |
|-----------|-----|
| **Frontend** | http://localhost:5500 |
| **API Server** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |

### Demo Credentials
```
Trainee: trainee_demo / password123
Trainer: trainer_demo / password123
Admin:   admin / admin123
```

** [See Full Startup Guide](STARTUP.md) for detailed instructions**

##  How It Works

### For Trainees
1. Register as Trainee
2. View your Uma Musume details
3. Submit stats (Speed, Stamina, Power, Guts, Wit: 0-9999 each)
4. Stats are locked once submitted (no re-grinding)
5. Enter races with locked stats
6. Chat and make friends

### For Trainers
1. Register as Trainer  
2. Own and manage trainees (Uma Musume)
3. Submit stats on behalf of trainees
4. Enter trainees in races
5. View submission history and audit trail

### For Admins
1. User management (ban/unban)
2. Override stats for special cases
3. Moderate chat and DMs
4. View complete audit logs
5. System configuration

##  Tech Stack

### Backend
- **FastAPI** - REST API framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Development database (PostgreSQL ready)
- **JWT** - Secure token authentication
- **Bcrypt** - Password hashing
- **Uvicorn** - ASGI application server

### Frontend
- **HTML5/CSS3** - Modern responsive design
- **JavaScript (ES6+)** - Dynamic interactions
- **localStorage** - Token persistence
- **Fetch API** - API communication

##  Project Structure

```
UmaRacingWeb/
 backend/
    main.py                      # FastAPI entry point
    requirements.txt             # Dependencies
    app/
       db.py                   # Database setup
       models/
          database.py         # SQLAlchemy models
          user.py             # Auth models
          race.py             # Racing models
       services/
          auth_service.py    # JWT & password
          stat_validator.py  # Stat validation
          race_service.py     # Race engine
       routes/
           auth.py             # Authentication
           stats.py            # Stats
           races.py            # Races
           chat.py             # Chat
           friends.py          # Friends
           dms.py              # Messaging
           admin.py            # Admin
    races.py                    # Race database
    skills.py                   # Skills database

 frontend/
    register.html               # Registration
    login.html                  # Login
    dashboard.html              # Main dashboard
    admin-dashboard.html        # Admin panel

 docs/
    STAT_SYSTEM.md             # Stat system design
    DATABASE_SCHEMA.md         # Database schema

 STARTUP.md                      # Setup guide
 README.md
```

##  API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create account
- `POST /login` - Login with JWT
- `GET /me` - Current user info

### Stats (`/api/stats`)
- `POST /submit` - Submit stats
- `GET /{trainee_id}` - Latest stats
- `GET /{trainee_id}/history` - History

### Races (`/api/races`)
- `POST /create` - Create race
- `GET /` - List races
- `POST /{race_id}/enter` - Enter race

### Social
- `POST /friends/request` - Friend request
- `GET /friends/list` - Friends list
- `POST /chat/send` - Public chat
- `POST /dms/send` - DM

### Admin (`/api/admin`)
- `POST /users/ban` - Ban user
- `POST /stats/override` - Override stat
- `GET /audit-log` - Audit log

##  Key Design Principles

- **No Training/Grinding**: Stats are input-only, no progression decay
- **Immutable Snapshots**: Race stats frozen at entry time
- **Full Audit Trail**: Every action logged for transparency
- **Role-Based Access**: Strict permissions per user role
- **Spreadsheet Integration**: Stats validated against external rules

##  Documentation

- **[STARTUP.md](STARTUP.md)** - Complete setup guide
- **[STAT_SYSTEM.md](docs/STAT_SYSTEM.md)** - Stat system design
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Database schema
- **API Docs**: http://localhost:8000/docs (Swagger UI)

##  Deployment

Create `.env` in `backend/`:
```
DATABASE_URL=sqlite:///uma_racing.db
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

For production:
- Use PostgreSQL database
- Generate secure JWT secret
- Set specific CORS domains
- Enable HTTPS
- Use production ASGI server

##  License

All rights reserved - see [LICENSE](LICENSE)

##  Acknowledgments

- Uma Musume Pretty Derby by Cygames
- Original UmaRacingProject

---

Made with  for Uma Musume fans
