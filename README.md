# 🏇 UmaRacingWeb

**Created by WinandMe (Safi) & Ilfaust-Rembrandt (Quaggy) | Fan Project for Uma Musume Pretty Derby**  
**Uma Musume © Cygames - This is a non-commercial fan-made simulator**

**Official Repository:** [https://github.com/WinandMe/UmaRacingWeb](https://github.com/WinandMe/UmaRacingWeb)

A modern web-based **real-time racing simulator** for Uma Musume Pretty Derby featuring accurate race mechanics, photo finish detection, and WebSocket-powered live race updates with React frontend.

---

## 💝 About This Project

**This is a fan-made project created with love for Uma Musume Pretty Derby.**  
We respect Cygames' intellectual property and created this as a **non-commercial tribute** to the game.

### Please Respect Our Work

We've spent countless hours implementing accurate race mechanics and building this system.  
If you're inspired by our work:

✅ **DO:**
- Give credit to WinandMe & Ilfaust-Rembrandt if you reference our implementation
- Link back to this repository if you discuss our work
- Reach out if you want to collaborate or learn from our code
- Respect the Uma Musume community and Cygames' IP

❌ **PLEASE DON'T:**
- Copy our code and claim you wrote it yourself
- Remove our credits and authentication markers
- Use this commercially without Cygames' permission
- Distribute modified versions without giving us credit

**Project Fingerprint:** `URS-PROJECT-2026-WMIRQ-MASTER`  
*This codebase contains embedded signatures to help identify our implementation if someone copies it without credit.*

---

## 🎮 Features

### Core Racing System
- **⚡ Real-time Race Simulation**: Tick-based (0.05s) physics simulation with WebSocket-powered live updates
- **🏁 Photo Finish Detection**: Hybrid system with weighted tiebreaker (60% Velocity, 20% Accel, 20% Power) + manual override
- **📊 Complete Race Database**: 169+ races across G1, G2, G3, and International categories
- **🎯 Uma Musume Mechanics**: 
  - Distance/Surface aptitude acceleration
  - Running style strategies (逃げ/先行/差し/追込)
  - Complex skill activation system with 240+ skills
  - Spurt/last spurt phase mechanics
  - Stamina management and position blocking

### Code Protection & Verification
- **🔐 Ultra-Strict Verification**: Multi-signature authentication system (11 signatures across 3 critical files)
- **✅ Startup Verification**: App checks code integrity on launch - blocks if signatures missing
- **⚠️ Theft Detection**: Embedded authentication hashes (URS-2026-WMIRQ) to identify unauthorized copies
- **📋 Disclaimer Screen**: Legal notice about Cygames IP ownership and fan project status

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Python 3.8+ (Python 3.11 or 3.12 recommended for best compatibility)
- Node.js 14+
- Git
- **Windows users**: May need [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) if installation fails

### Quick Setup (Windows)

**For Windows users**, we provide automated setup scripts:

#### First Time Setup
```bash
# Clone repository
git clone https://github.com/WinandMe/UmaRacingWeb.git
cd UmaRacingWeb

# Run first-time initialization (installs all dependencies)
first_init.bat
```

This will:
1. Check Python installation
2. Install backend dependencies (pip install)
3. Check Node.js installation
4. Install frontend dependencies (npm install)

**Note:** If installation fails with Rust/pydantic-core error, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

#### Running the Application
```bash
# Start both backend and frontend
start.bat
```

This will:
- Start backend server on port 5000 (current window)
- Open new window and start frontend on port 3000
- Display access URLs

### Manual Setup (All Platforms)

### 1. Clone Repository
```bash
git clone https://github.com/WinandMe/UmaRacingWeb.git
cd UmaRacingWeb
```

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt
```

**Required packages:**
- fastapi
- uvicorn[standard]
- pydantic

### 3. Start Backend Server
```bash
python main.py
# OR
uvicorn main:app --reload --port 5000
```

Expected output:
```
======================================================================
  Uma Racing Simulator - Backend Server
  Created by WinandMe & Ilfaust-Rembrandt
  Fan project for Uma Musume Pretty Derby (© Cygames)
  Authentication: URS-API-2026-WMIRQ-BACKEND
  Please respect our work and give credit if you use it! 💙
======================================================================

INFO:     Uvicorn running on http://0.0.0.0:5000
```

### 4. Setup Frontend (New Terminal)
```bash
cd frontend
npm install
npm start
```

Frontend will start on `http://localhost:3000`

### 5. Access Application

| Component | URL |
|-----------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:5000 |
| **API Docs** | http://localhost:5000/docs |

**First Launch:**
1. Verification screen (checks code authenticity - 1.5s)
2. Disclaimer screen (acknowledge Cygames IP ownership)
3. Main menu (load race configuration)
4. Race execution (watch live simulation)

## 🔧 How It Works

### Race Simulation Flow
1. **Load Race Config** - Choose from 169+ official races or create custom configuration
2. **Setup Participants** - Configure Uma Musume with stats (Speed, Stamina, Power, Guts, Wit) and skills
3. **Start Race** - Live WebSocket stream updates every 0.05s tick
4. **Watch Live** - Real-time position updates, speed changes, skill activations
5. **Photo Finish** - Automatic detection for ties (<0.001s difference) with weighted tiebreaker
6. **Results** - Detailed analysis with final times, max speeds, positions throughout race

### Race Mechanics
- **Tick-based Physics**: 0.05s intervals simulating speed, acceleration, stamina consumption
- **Running Styles**: 
  - 逃げ (Nige/Runner): Leads from start
  - 先行 (Senko/Leader): Stays near front
  - 差し (Sashi/Betweener): Mid-pack, closes late
  - 追込 (Oikomi/Chaser): Back, explosive finish
- **Skill System**: 240+ skills with conditional activation (position, phase, stamina, distance)
- **Aptitude Bonuses**: Distance/Surface aptitudes affect acceleration
- **Phase Transitions**: Start → Mid-race → Spurt (last 1/3) → Last Spurt (final 1/6)
- **Stamina Management**: Running out causes massive speed penalty

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern async REST API framework
- **Uvicorn** - Lightning-fast ASGI server
- **Pydantic** - Data validation with type hints
- **WebSocket** - Real-time race updates
- **Python 3.8+** - Core simulation engine

### Frontend
- **React 18** - Component-based UI framework
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client for API calls
- **TailwindCSS** - Utility-first styling
- **WebSocket API** - Real-time race streaming

### Race Engine
- **race_engine.py** (4734 lines) - Core simulation logic
- **skills.py** - 240+ Uma Musume skills database
- **races.py** - 169+ official race data (G1/G2/G3/International)

## 📁 Project Structure

```
UmaRacingWeb/
├── backend/
│   ├── main.py                           # FastAPI server with WebSocket
│   ├── race_engine.py                    # Core simulation (4734 lines)
│   ├── skills.py                         # Skills database (240+ skills)
│   ├── verify_integrity.py               # Code authentication checker
│   ├── requirements.txt                  # Python dependencies
│   └── app/
│       ├── models/
│       │   └── race.py                  # Pydantic models
│       ├── services/
│       │   └── race_service.py          # Race engine wrapper
│       └── races.py                     # Race database (169+ races)
│
├── frontend/
│   ├── src/
│   │   ├── App.js                       # Main React app with 4-phase flow
│   │   ├── components/
│   │   │   ├── VerificationScreen.js   # Code integrity check (startup)
│   │   │   ├── DisclaimerScreen.js     # Cygames IP disclaimer
│   │   │   ├── ConfigLoader.js         # Race config loader (main menu)
│   │   │   ├── RaceContainer.js        # Race execution & display
│   │   │   ├── ConfigGenerator.js      # Create custom races
│   │   │   └── ParticipantDetails.js   # Uma details viewer
│   │   └── index.js                     # React entry point
│   ├── public/
│   ├── package.json                     # npm dependencies
│   └── tailwind.config.js               # Tailwind styling
│
├── ignored/                              # Development/testing files (not in repo)
│   ├── check_integrity.py               # Signature validation script
│   ├── test_stolen_code_detection.py    # Theft detection tester
│   ├── test_theft_scenario.py           # Theft simulation
│   ├── CODE_OWNERSHIP_VERIFICATION.md   # Protection system docs
│   ├── SECURITY.md                      # Community guidelines
│   ├── DMCA_TAKEDOWN_TEMPLATE.md        # Credit dispute template
│   └── TEST_RESULTS_SUMMARY.md          # Test results
│
├── first_init.bat                        # Windows: First-time setup script
├── start.bat                             # Windows: Start application script
├── .gitignore                            # Git ignore rules
├── LICENSE
└── README.md
```

## 📡 API Endpoints

### Verification (`/api`)
- `GET /verify-integrity` - Check authentication signatures (11 signatures)

### Race Management (`/api/race`)
- `POST /load-config` - Upload race JSON configuration
- `GET /config` - Get current race configuration
- `POST /start` - Start race simulation
- `POST /stop` - Stop race
- `POST /set-speed` - Set simulation speed (1x, 2x, 5x, 10x)
- `GET /participant/{umaName}` - Get Uma Musume details

### Race Data (`/api`)
- `GET /race-categories` - List categories (G1, G2, G3, International)
- `GET /races/{category}` - Get races by category
- `GET /skills` - Get all 240+ skills

### WebSocket
- `WS /ws/race/{clientId}` - Real-time race updates stream
  - Sends race frame every 0.05s tick
  - Position, speed, stamina, skill activations
  - Race finish event with results

## 🎯 Key Design Principles

- **Accurate Simulation**: Faithful recreation of Uma Musume race mechanics
- **Real-time Updates**: WebSocket streams 20 ticks/second for smooth visualization
- **Photo Finish Precision**: Hybrid automatic + manual system for ultra-close races
- **Code Protection**: Multi-layer authentication system prevents unauthorized copying
- **Fan Project Ethics**: Respects Cygames IP, requires disclaimer acknowledgment
- **Open Architecture**: Modular design for easy extension and modification

## [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Installation issues and common problems
- **📚 Documentation

- **API Docs**: http://localhost:5000/docs (Swagger UI - interactive API documentation)

### Development & Testing Files

The following files are available in the `ignored/` folder for development/testing purposes (not tracked in git):

- **check_integrity.py** - Validates all 11 authentication signatures across codebase
- **test_stolen_code_detection.py** - Scans for hidden authentication markers
- **test_theft_scenario.py** - Simulates code theft detection scenarios
- **CODE_OWNERSHIP_VERIFICATION.md** - Detailed 11-layer protection system documentation
- **SECURITY.md** - Community guidelines & credit policy
- **DMCA_TAKEDOWN_TEMPLATE.md** - Template for credit dispute resolution
- **TEST_RESULTS_SUMMARY.md** - Comprehensive theft detection test results

These files contain sensitive information about the protection system and are excluded from the public repository.

## 🚀 Deployment

### Backend Configuration
Default port: `5000`  
To change, edit `main.py` line 382:
```python
uvicorn.run(app, host="0.0.0.0", port=5000)
```

### Frontend Configuration
Update API endpoints if backend port changes:
- `src/components/VerificationScreen.js`
- `src/components/RaceContainer.js`
- `src/components/ConfigLoader.js`
- `src/components/ConfigGenerator.js`

### CORS Settings
Backend allows these origins (main.py line 50-52):
```python
allow_origins=["http://localhost:3000", "http://localhost:5173"]
```

### Production
- Use production-grade ASGI server (Gunicorn + Uvicorn workers)
- Enable HTTPS
- Set specific CORS domains
- Consider caching for race database endpoints
- Monitor WebSocket connection limits

## 🛡️ Code Protection & Security

This project includes **ultra-strict verification** with 11 embedded authentication signatures:

**For Developers:**

Testing and validation tools are available locally in the `ignored/` folder:
```bash
# Run these commands from the project root (if you have the ignored/ folder)
python ignored/check_integrity.py              # Check all 11 signatures
python ignored/test_stolen_code_detection.py   # Scan for hidden markers
python ignored/test_theft_scenario.py          # Simulate theft detection
```

**Manually Trigger Error:**
Comment out any signature (e.g., line 86 in race_engine.py) → restart backend → red warning screen appears

**Test Protection:**
```bash
python check_integrity.py           # Check all 11 signatures
python test_stolen_code_detection.py # Scan for hidden markers
python test_theft_scenario.py       # Simulate theft detection
```

**Manually Trigger Error:**
Comment out any signature (e.g., line 86 in race_engine.py) → restart → red warning screen

## 📄 License

All rights reserved - see [LICENSE](LICENSE)

**This is a fan-made project for Uma Musume Pretty Derby (© Cygames).**  
Not affiliated with or endorsed by Cygames.

## 🙏 Acknowledgments

- **Uma Musume Pretty Derby** by Cygames - Original game and characters
- **Game8.jp / GameTora** - Race data and mechanics research
- **r/UmamusumeFFS** - Community support
- **Uma Musume fans worldwide** - For keeping the spirit alive ❤️

---

**Made with ❤️ for Uma Musume fans**  
**Created by WinandMe (Safi) & Ilfaust-Rembrandt (Quaggy)**  
**Repository:** https://github.com/WinandMe/UmaRacingWeb
