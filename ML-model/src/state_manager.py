import threading

class GlobalState:
    """
    A Thread-Safe 'Notepad' for exchanging data between:
    1. The API Server (api.py) -> Receives/Sends commands
    2. The AI Worker (composer.py) -> Generates music
    """
    def __init__(self):
        # A Lock ensures two threads don't write at the exact same nanosecond
        self.lock = threading.Lock()
        
        # --- THE MEMORY VARIABLES ---
        # Now stores the full spectrum of brainwaves for the RAG frontend
        self.current_metrics = {
            "theta": 0.0,
            "alpha": 0.0,
            "beta": 0.0,
            "stress_ratio": 1.0,
            "stress_score": 0.5
        }
        self.latest_music_file = None    # Path to the newest .wav
        self.is_session_active = False   # Is the system running?

        # --- NEW: Track the active user ---
        self.current_person_id = "default_user"

        # --- NEW: The Sync Token ---
        self.generation_count = 0

    # Add these two new functions at the bottom of the class:
    def increment_generation(self):
        with self.lock:
            self.generation_count += 1

    def get_generation_count(self):
        with self.lock:
            return self.generation_count

    def update_metrics(self, metrics_dict):
        """Called by Brain or API to update current user status"""
        with self.lock:
            self.current_metrics.update(metrics_dict)

    def get_metrics(self):
        """Called by API when React/RAG asks for the brainwaves"""
        with self.lock:
            return self.current_metrics.copy() # Return a copy to prevent thread collisions

    def set_latest_file(self, filename):
        """Called by AI when a new song is finished"""
        with self.lock:
            self.latest_music_file = filename

    def get_latest_file(self):
        """Called by API when React asks for the song"""
        with self.lock:
            return self.latest_music_file

# Create a single global instance
# This 'shared_state' variable is what you import in other files
shared_state = GlobalState()