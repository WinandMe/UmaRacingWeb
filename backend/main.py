"""
FastAPI backend for Uma Racing Simulator
WebSocket for real-time race updates
REST API for configuration and results

Authentication: URS-API-2026-WMIRQ-BACKEND
Authors: WinandMe, Ilfaust-Rembrandt
Created by: WinandMe (Safi) & Ilfaust-Rembrandt (Quaggy)
"""

from fastapi import FastAPI, File, UploadFile, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import asyncio
from typing import Dict, List
import os
import sys
import traceback as tb

# Add error handler for uncaught exceptions
def handle_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    
    print(f"UNCAUGHT EXCEPTION: {exc_type.__name__}: {exc_value}", file=sys.stderr)
    tb.print_exception(exc_type, exc_value, exc_traceback, file=sys.stderr)

sys.excepthook = handle_exception

from app.models.race import RaceConfig, RaceFrame, RaceResult, ParticipantStats
from app.services.race_service import race_service
from app.races import G1_RACES, G2_RACES, G3_RACES, INTERNATIONAL_RACES, Racecourse, Surface

# Import skills from skills.py (in backend root)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from skills import SKILLS_DATABASE

app = FastAPI(
    title="Uma Racing Simulator API",
    description="Real-time horse racing simulation engine",
    version="1.0.0"
)

# Copyright Notice - Displayed on startup
print("\n" + "="*70)
print("  Uma Racing Simulator - Backend Server")
print("  Created by WinandMe & Ilfaust-Rembrandt")
print("  Fan project for Uma Musume Pretty Derby (© Cygames)")
print("  Please respect our work and give credit if you use it! 💙")
print("="*70 + "\n")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# ============ VERIFICATION ENDPOINT ============

@app.get("/api/verify-integrity")
async def verify_integrity():
    """Verify code integrity by checking authentication signatures"""
    try:
        from verify_integrity import check_critical_signatures
        result = check_critical_signatures()
        return result
    except Exception as e:
        return {
            'authentic': False,
            'signatures_found': 0,
            'signatures_expected': 3,
            'checked_files': [],
            'missing_signatures': ['verification error'],
            'message': f'Verification error: {str(e)}'
        }

# ============ REST ENDPOINTS ============

@app.post("/api/race/load-config")
async def load_race_config(file: UploadFile = File(...)):
    """Load race configuration from JSON file"""
    try:
        print("[API] Reading file...")
        contents = await file.read()
        print(f"[API] File size: {len(contents)} bytes")
        
        print("[API] Decoding JSON...")
        config_dict = json.loads(contents.decode('utf-8'))
        print(f"[API] JSON decoded successfully")
        
        print("[API] Creating RaceConfig...")
        config = RaceConfig(**config_dict)
        print(f"[API] RaceConfig created: {config.race.name}")
        
        print("[API] Loading race config into service...")
        race_service.load_race_config(config)
        print("[API] Race config loaded successfully!")
        
        return {"status": "success", "message": "Config loaded successfully", "race_name": config.race.name}
    except Exception as e:
        print(f"[API] ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/race/config")
async def get_race_config():
    """Get the currently loaded race configuration"""
    if not race_service.config_data:
        raise HTTPException(status_code=400, detail="No config loaded")
    return race_service.config_data.model_dump()

@app.post("/api/race/start")
async def start_race():
    """Start the race simulation"""
    try:
        race_service.start_race()
        return {"status": "success", "message": "Race started"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/race/stop")
async def stop_race():
    """Stop the race simulation"""
    race_service.sim_running = False
    return {"status": "success", "message": "Race stopped"}

@app.post("/api/race/reset")
async def reset_race():
    """Reset the race"""
    race_service.finish_times.clear()
    race_service.uma_finished.clear()
    race_service.overtakes.clear()
    race_service.sim_time = 0.0
    return {"status": "success", "message": "Race reset"}

@app.get("/api/race/status")
async def get_race_status() -> Dict:
    """Get current race status"""
    return {
        "sim_running": race_service.sim_running,
        "sim_time": race_service.sim_time,
        "races_finished": len(race_service.finish_times),
        "uma_of_race": race_service.uma_of_race_horse
    }

@app.get("/api/race/results")
async def get_results() -> RaceResult:
    """Get final race results"""
    if not race_service.finish_times:
        raise HTTPException(status_code=400, detail="Race not finished yet")
    return race_service.get_final_results()

@app.get("/api/race/participant/{uma_name}")
async def get_participant_details(uma_name: str) -> ParticipantStats:
    """Get detailed stats for a participant"""
    try:
        return race_service.get_participant_stats(uma_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/race/honorable-mentions")
async def get_honorable_mentions() -> List[Dict]:
    """Get honorable mentions for all participants"""
    mentions = []
    for i, line in enumerate(race_service.achievement_lines):
        mentions.append({
            "position": i + 1,
            "achievement": line
        })
    return mentions

@app.get("/api/races")
async def get_races_list():
    """Get list of all available races organized by category"""
    
    def race_to_dict(race):
        return {
            "id": race.id,
            "name": race.name,
            "name_jp": race.name_jp,
            "distance": race.distance,
            "race_type": race.race_type.value,
            "surface": race.surface.value,
            "racecourse": race.racecourse.value,
            "direction": race.direction.value,
            "month": race.month,
            "eligibility": race.eligibility,
            "prize_money": race.prize_money
        }
    
    g1_list = [race_to_dict(race) for race in G1_RACES.values()]
    g2_list = [race_to_dict(race) for race in G2_RACES.values()]
    g3_list = [race_to_dict(race) for race in G3_RACES.values()]
    intl_list = [race_to_dict(race) for race in INTERNATIONAL_RACES.values()]
    
    return {
        "G1": {
            "total": len(g1_list),
            "races": g1_list
        },
        "G2": {
            "total": len(g2_list),
            "races": g2_list
        },
        "G3": {
            "total": len(g3_list),
            "races": g3_list
        },
        "International": {
            "total": len(intl_list),
            "races": intl_list
        }
    }

@app.get("/api/races/{category}")
async def get_races_by_category(category: str):
    """Get races for a specific category (G1, G2, G3, International)"""
    
    def race_to_dict(race):
        return {
            "id": race.id,
            "name": race.name,
            "name_jp": race.name_jp,
            "distance": race.distance,
            "race_type": race.race_type.value,
            "surface": race.surface.value,
            "racecourse": race.racecourse.value,
            "direction": race.direction.value,
            "month": race.month,
            "eligibility": race.eligibility,
            "prize_money": race.prize_money
        }
    
    category_upper = category.upper()
    
    if category_upper == "G1":
        races = [race_to_dict(race) for race in G1_RACES.values()]
    elif category_upper == "G2":
        races = [race_to_dict(race) for race in G2_RACES.values()]
    elif category_upper == "G3":
        races = [race_to_dict(race) for race in G3_RACES.values()]
    elif category_upper == "INTERNATIONAL":
        races = [race_to_dict(race) for race in INTERNATIONAL_RACES.values()]
    else:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}. Use G1, G2, G3, or International")
    
    return {
        "category": category_upper,
        "total": len(races),
        "races": races
    }

@app.get("/api/race-categories")
async def get_race_categories():
    """Get available race categories with counts"""
    return {
        "categories": {
            "G1": len(G1_RACES),
            "G2": len(G2_RACES),
            "G3": len(G3_RACES),
            "International": len(INTERNATIONAL_RACES)
        },
        "total": len(G1_RACES) + len(G2_RACES) + len(G3_RACES) + len(INTERNATIONAL_RACES)
    }

@app.get("/api/skills")
async def get_skills_list():
    """Get list of all available skills"""
    skills_list = []
    for skill_id, skill in SKILLS_DATABASE.items():
        skills_list.append({
            "id": skill.id,
            "name": skill.name,
            "description": skill.description,
            "rarity": skill.rarity.name if hasattr(skill.rarity, 'name') else str(skill.rarity),
            "icon": skill.icon
        })
    return {
        "total": len(skills_list),
        "skills": skills_list
    }

@app.get("/api/racecourses")
async def get_racecourses():
    """Get list of all available racecourses"""
    racecourses = [rc.value for rc in Racecourse]
    return {
        "total": len(racecourses),
        "racecourses": sorted(racecourses)
    }

@app.post("/api/race/set-speed")
async def set_race_speed(speed_multiplier: float = 1.0):
    """Set race speed multiplier"""
    race_service.speed_multiplier = max(0.1, min(10.0, speed_multiplier))  # Clamp between 0.1 and 10.0
    return {"status": "success", "speed_multiplier": race_service.speed_multiplier}

# ============ WEBSOCKET FOR REAL-TIME UPDATES ============

@app.websocket("/ws/race/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time race frame updates"""
    await websocket.accept()
    active_connections[client_id] = websocket
    frame_count = 0
    last_frame_time = 0
    
    try:
        while True:
            # Get current race frame
            if race_service.sim_running:
                # Use 0.033 seconds (33ms) for frame delta 
                # With 16ms WebSocket sleep, this ensures proper 1x speed (1 sim second = 1 real second)
                frame = race_service.get_race_frame(delta_time=0.033, speed_multiplier=race_service.speed_multiplier)
                
                # Convert frame to dict
                frame_data = frame.model_dump()
                
                # Send frame as JSON (serialize Pydantic model)
                message = {
                    "type": "frame",
                    "data": frame_data
                }
                
                await websocket.send_json(message)
                frame_count += 1
                
                # Log first few frames in detail
                if frame_count <= 5:
                    print(f"[WS {client_id}] Frame {frame_count}: {len(frame_data.get('positions', []))} positions, race_finished={frame_data.get('race_finished')}, speed_mult={race_service.speed_multiplier}")
                    if frame_count == 1 and len(frame_data.get('positions', [])) > 0:
                        print(f"[WS {client_id}] Sample position: {frame_data['positions'][0]}")
                
                # Remember last frame time for detecting race end
                last_frame_time = frame_data.get('sim_time', 0)
                
                # If race just finished, send final message and close connection gracefully
                if frame_data.get('race_finished'):
                    print(f"[WS {client_id}] Race finished! Sending final frame and closing connection.")
                    await asyncio.sleep(0.1)
                    await websocket.close(code=1000, reason="Race finished")
                    break
                
                # Small delay to avoid hammering
                await asyncio.sleep(0.016)  # ~60 FPS
            else:
                # Wait a bit if race not running
                if frame_count > 0:
                    print(f"[WS {client_id}] Race stopped. Last frame at {last_frame_time:.2f}s, {frame_count} total frames sent")
                    frame_count = 0  # Reset for next race
                await asyncio.sleep(0.1)
                
    except Exception as e:
        print(f"❌ WebSocket error for {client_id} after {frame_count} frames: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        try:
            if client_id in active_connections:
                del active_connections[client_id]
                print(f"[WS {client_id}] Connection closed")
        except Exception as cleanup_err:
            print(f"Cleanup error: {cleanup_err}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Uma Racing Simulator API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
