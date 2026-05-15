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
        self.current_stress = 0.5        # Default neutral stress
        self.latest_music_file = None    # Path to the newest .wav
        self.is_session_active = False   # Is the system running?

    def update_stress(self, score):
        """Called by Brain or API to update current user status"""
        with self.lock:
            self.current_stress = score

    def get_stress(self):
        """Called by AI to decide what music to play next"""
        with self.lock:
            return self.current_stress

    def set_latest_file(self, filename):
        """Called by AI when a new song is finished"""
        with self.lock:
            self.latest_music_file = filename

    def get_latest_file(self):
        """Called by API when Java/Frontend asks for the song"""
        with self.lock:
            return self.latest_music_file

# Create a single global instance
# This 'shared_state' variable is what you import in other files
shared_state = GlobalState()