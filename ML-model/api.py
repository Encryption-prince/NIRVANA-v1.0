from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import threading
import time
import csv

# IMPORT YOUR MODULES
# Ensure these files are in the 'src' folder as we discussed
from src.state_manager import shared_state
from src.composer import MusicGeneratorThread
from src.brain import EEGProcessor

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

# --- STARTUP EVENT ---
@app.on_event("startup")
def startup_event():
    # 1. Create output folder if missing
    if not os.path.exists("generated_clips"):
        os.makedirs("generated_clips")
    print("[API] System Initialized. Ready to Start.")

def hardware_listener_loop():
    print("[Hardware] Attempting to connect to EEG sensor...")
    brain_sensor = EEGProcessor(port='COM5') 
    
    if not brain_sensor.serial_conn:
        return

    print("[Hardware] Connected! Starting live data stream...")
    
    # The 'with' block opens the file
    with open('benchmarks/my_session_data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Time_Seconds', 'Stress_Ratio'])
        start_time = time.time()
        
        # Notice how the 'while' loop is indented inside the 'with' block!
        # This keeps the file open as long as the session is running.
        while shared_state.is_session_active:
            live_stress_ratio = brain_sensor.get_stress_index()
            shared_state.update_stress(live_stress_ratio)
            
            elapsed = int(time.time() - start_time)
            writer.writerow([elapsed, live_stress_ratio])
            f.flush()

# --- ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "N.I.R.V.A.N.A. Core is Online. Use POST /start-session to begin."}

@app.post("/start-session")
def start_session():
    """Starts both the Hardware Listener and the AI Composer."""
    global ai_thread, hardware_thread
    
    if shared_state.is_session_active:
        return {"status": "Session is already running!"}

    print("[API] Starting N.I.R.V.A.N.A. Session...")
    shared_state.is_session_active = True
    
    # 1. Start the Hardware Listener Thread
    hardware_thread = threading.Thread(target=hardware_listener_loop, daemon=True)
    hardware_thread.start()
    
    # 2. Start the AI Composer Thread
    ai_thread = MusicGeneratorThread(output_queue=None, duration=15)
    ai_thread.start()
    
    return {
        "status": "Live Session Started", 
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
    return {
        "stress_score": shared_state.get_stress(),
        "is_active": shared_state.is_session_active
    }

@app.post("/stop-session")
def stop_session():
    """Stops all threads."""
    global ai_thread, hardware_thread
    
    shared_state.is_session_active = False # This flag tells both threads to exit their while loops
    
    if ai_thread and ai_thread.is_alive():
        print("[API] Stopping AI Thread...")
        ai_thread.running = False
        ai_thread.join()
        ai_thread = None
        
    if hardware_thread and hardware_thread.is_alive():
        print("[API] Stopping Hardware Thread...")
        hardware_thread.join()
        hardware_thread = None
    
    return {"status": "Session Stopped. Hardware disconnected."}

# To run: uvicorn api:app --host 0.0.0.0 --port 8000