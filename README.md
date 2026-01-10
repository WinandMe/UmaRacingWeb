# 🏇 UmaRacingWeb

A modern web-based racing simulation platform for Uma Musume Pretty Derby, featuring real-time race visualization, comprehensive race configuration, and detailed horse statistics.

## ✨ Features

- **🎮 Real-time Race Simulation**: Watch races unfold in real-time with WebSocket-powered updates
- **⚙️ Advanced Config Generator**: Create custom race configurations with 169+ races across G1, G2, G3, and International categories
- **📊 Detailed Statistics**: View comprehensive horse stats, aptitudes, skills, and performance metrics
- **🎯 Skill System**: Access 7,920+ skills with rarity levels, icons, and detailed descriptions
- **🏟️ Complete Race Database**: 
  - 26 G1 Races (Arima Kinen, Japan Cup, Tokyo Yushun, etc.)
  - 35 G2 Races
  - 40 G3 Races
  - 68 International Races
- **🔍 Smart Filtering**: Filter races by category and racecourse
- **💾 Config Management**: Save and load race configurations as JSON files
- **🎨 Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **📈 Live Commentary**: Dynamic race commentary with position updates

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## 📖 Usage

### 1. Config Generator
- Click **"⚙️ Config Generator"** to create custom race configurations
- Select race category (G1/G2/G3/International)
- Filter races by racecourse
- Add and customize horses with stats, aptitudes, and skills
- **Save as JSON** to export configurations
- **Load Config** to start the race immediately

### 2. Config Loader
- Upload existing race configuration JSON files
- Start races and watch them unfold in real-time
- Click on horse names to view detailed statistics
- Get Tazuna's advice based on race performance

### 3. Race Categories
- **G1**: 26 prestigious races including Arima Kinen (¥500M), Japan Cup, Tokyo Yushun
- **G2**: 35 grade-2 races across various distances and surfaces
- **G3**: 40 grade-3 races with diverse conditions
- **International**: 68 races from around the world

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **WebSockets**: Real-time race updates
- **Pydantic**: Data validation and serialization
- **Uvicorn**: ASGI server

### Frontend
- **React 18**: Modern UI library
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Axios**: HTTP client
- **WebSocket API**: Real-time communication

## 📁 Project Structure

```
UmaRacingWeb/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── app/
│   │   ├── models/
│   │   │   ├── race.py        # Race data models
│   │   │   └── horse.py       # Horse data models
│   │   ├── services/
│   │   │   └── race_service.py # Race simulation engine (4,734 lines)
│   │   ├── routes/
│   │   │   └── race_routes.py  # API endpoints
│   │   ├── races.py            # Complete race database (169 races, 3,241 lines)
│   │   └── websocket/
│   │       └── manager.py      # WebSocket connection manager
│   └── skills.py               # Skills database (7,920+ skills)
├── frontend/
│   ├── package.json            # Node dependencies
│   ├── public/
│   ├── src/
│   │   ├── App.js             # Main application component
│   │   ├── components/
│   │   │   ├── ConfigGenerator.js  # Race config generator
│   │   │   ├── ConfigLoader.js     # Config file loader
│   │   │   ├── RaceVisualization.js # Race display
│   │   │   └── HorseStats.js       # Horse statistics modal
│   │   ├── styles/
│   │   └── utils/
│   └── tailwind.config.js     # Tailwind CSS configuration
├── LICENSE
├── README.md
└── QUICKSTART.md              # Detailed setup guide
```

## 🎯 API Endpoints

### Race Management
- `POST /api/race/load-config` - Upload and load race configuration
- `GET /api/race/start` - Start the race simulation
- `GET /api/race/status` - Get current race status
- `WS /ws/{client_id}` - WebSocket connection for real-time updates

### Data Access
- `GET /api/race-categories` - Get race category counts
- `GET /api/races` - Get all races organized by category
- `GET /api/races/{category}` - Get races for specific category (G1/G2/G3/International)
- `GET /api/skills` - Get all 7,920+ skills with details
- `GET /api/racecourses` - Get list of all racecourses

## 🎮 Race Configuration Format

```json
{
  "race": {
    "name": "Arima Kinen",
    "distance": 2500,
    "type": "Long",
    "surface": "Turf",
    "racecourse": "Nakayama",
    "track_condition": "Good"
  },
  "umas": [
    {
      "name": "King Argentine",
      "running_style": "FR",
      "gate_number": 1,
      "mood": "Normal",
      "stats": {
        "Speed": 1000,
        "Stamina": 1000,
        "Power": 1000,
        "Guts": 1000,
        "Wit": 1000
      },
      "distance_aptitude": {
        "Sprint": "A",
        "Mile": "A",
        "Medium": "A",
        "Long": "S"
      },
      "surface_aptitude": {
        "Turf": "A",
        "Dirt": "B"
      },
      "skills": ["skill_id_1", "skill_id_2"]
    }
  ]
}
```

## 🤝 Contributing

Please contact me via GitHub / email. outside of it will considered invalid

## 📝 License

This project is licensed under the All rights reserved with explicit permissions - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Based on the original UmaRacingProject
- Uma Musume Pretty Derby game mechanics and data
- Community contributions and feedback

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with ❤️ for Uma Musume fans**
