from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import threading
import datetime, time
import csv

# IMPORT YOUR MODULES
from src.state_manager import shared_state
from src.composer import MusicGeneratorThread
from src.brain import EEGProcessor
from src.history_service import get_person_history, list_persons

app = FastAPI(title="NeuroMusic AI Service")

# Allow Java/React to talk to this API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL VARIABLES ---
ai_thread = None
hardware_thread = None

class SessionRequest(BaseModel):
    person_id: str = "default_user"

# --- STARTUP EVENT ---
@app.on_event("startup")
def startup_event():
    os.makedirs("generated_clips", exist_ok=True)
    os.makedirs(os.path.join("benchmarks", "history"), exist_ok=True)
    print("[API] System Initialized. Ready to Start.")


def hardware_listener_loop():
    print("[Hardware] Attempting to connect to EEG sensor...")
    brain_sensor = EEGProcessor(port='COM5') 
    
    if not brain_sensor.serial_conn:
        return

    print("[Hardware] Connected! Starting live data stream...")
    
    # --- NEW: Dynamic File Naming ---
    person_id = shared_state.current_person_id
    # Creates a timestamp like: 20260518_104239
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S") 
    file_path = os.path.join("benchmarks", "history", f"{person_id}_{timestamp}.csv")
    
    with open(file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Time_Seconds', 'Stress_Ratio', 'Alpha', 'Beta', 'Theta']) 
        start_time = time.time()
        
        while shared_state.is_session_active:
            live_metrics = brain_sensor.get_stress_index()
            shared_state.update_metrics(live_metrics)
            
            elapsed = int(time.time() - start_time)
            writer.writerow([
                elapsed, 
                live_metrics["stress_ratio"],
                live_metrics["alpha"],
                live_metrics["beta"],
                live_metrics["theta"]
            ]) 
            f.flush()
            
    print(f"[Hardware] Loop exited. Data saved to {file_path}")


# --- ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "N.I.R.V.A.N.A. Core is Online. Use POST /start-session to begin."}

@app.post("/start-session")
def start_session(req: SessionRequest):
    """Starts both the Hardware Listener and the AI Composer."""
    global ai_thread, hardware_thread
    
    if shared_state.is_session_active:
        return {"status": "Session is already running!"}

    # Save the user ID to the global state
    shared_state.current_person_id = req.person_id.strip() or "default_user"

    print(f"[API] Starting N.I.R.V.A.N.A. Session for user: {shared_state.current_person_id}...")
    shared_state.is_session_active = True
    
    hardware_thread = threading.Thread(target=hardware_listener_loop, daemon=True)
    hardware_thread.start()
    
    ai_thread = MusicGeneratorThread(output_queue=None, duration=15)
    ai_thread.start()
    
    return {
        "status": f"Live Session Started for {shared_state.current_person_id}", 
        "source": "Live Arduino Serial Stream"
    }

@app.get("/current-music")
def get_current_music():
    file_path = shared_state.get_latest_file()
    if not file_path:
        raise HTTPException(status_code=404, detail="No music generated yet. Please wait...")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server.")
    return FileResponse(file_path, media_type="audio/wav", filename="therapy_loop.wav")

@app.get("/current-stress")
def get_current_stress():
    # Grab the real brainwave dictionary from the state manager
    metrics = shared_state.get_metrics()
    metrics["is_active"] = shared_state.is_session_active

    # --- NEW: Inject the sync token ---
    metrics["generation_count"] = shared_state.get_generation_count()
    
    return metrics

@app.post("/stop-session")
def stop_session():
    """Stops all threads gracefully without deadlocking the API."""
    global ai_thread, hardware_thread
    
    # 1. Flip the global kill switch
    shared_state.is_session_active = False 
    
    # 2. Signal the AI thread to stop at the end of its current loop
    if ai_thread and ai_thread.is_alive():
        print("[API] Stop signal sent to AI Thread (It will exit after current generation)...")
        ai_thread.running = False
        ai_thread = None
        
    # 3. Clear hardware thread reference
    if hardware_thread and hardware_thread.is_alive():
        print("[API] Stop signal sent to Hardware Thread...")
        hardware_thread = None
    
    # 4. Return immediately so the React frontend doesn't timeout!
    return {"status": "Session Stopped. Hardware disconnecting..."}

@app.get("/persons")
def get_persons():
    """List subjects with recorded session history."""
    return {"persons": list_persons()}

@app.get("/history/{person_id}")
def get_history(person_id: str, session_index: int = -1):
    """EEG band metrics, improvement stats, and chart payloads for a subject."""
    try:
        return get_person_history(person_id, session_index=session_index)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except IndexError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc