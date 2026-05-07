import os
import glob
import pickle
import numpy as np
from scipy.signal import welch

"""class DEAPStreamer:
    """""""
    Simulates a live EEG stream by reading a DEAP .dat file chunk by chunk.
    """"""
    def __init__(self, data_folder="data"):
        self.data_folder = data_folder
        self.raw_data = None
        self.current_index = 0
        self.fs = 128 # DEAP dataset is downsampled to 128Hz
        
        # Load the file immediately upon startup
        self._load_file()

    def _load_file(self):
        # Find any .dat file in the data folder
        search_path = os.path.join(self.data_folder, "*.dat")
        files = glob.glob(search_path)
        
        if not files:
            print(f"[Error] No .dat files found in '{self.data_folder}'!")
            # Fallback to dummy noise if file missing (prevents crash)
            self.raw_data = np.random.normal(0, 1, 8064) 
            return

        filepath = files[0]
        print(f"[Brain] Loading real EEG data from: {filepath}")
        
        try:
            with open(filepath, 'rb') as f:
                # DEAP files are Python 2 pickled, so we need encoding='latin1'
                content = pickle.load(f, encoding='latin1')
                
                # Format: data -> (40 trials, 40 channels, 8064 samples)
                # We will pick Trial 0 and average the first 32 channels (EEG)
                # to get a robust "Global Brain Activity" signal.
                dataset = content['data']
                trial_data = dataset[0] # Pick the first video/trial
                eeg_channels = trial_data[:32, :] # First 32 are EEG
                
                # Combine all channels into one 1D array for simplicity
                self.raw_data = np.mean(eeg_channels, axis=0)
                
        except Exception as e:
            print(f"[Error] Failed to load file: {e}")
            self.raw_data = np.random.normal(0, 1, 8064)

    def get_next_chunk(self):
        """""""
        Returns 1 second of data (128 samples).
        Loops back to start if file ends.
        """"""
        chunk_size = self.fs # 1 second
        
        # Check if we reached end of file
        if self.current_index + chunk_size >= len(self.raw_data):
            self.current_index = 0 # Loop back
            print("[Brain] Replaying data file from start...")

        # Slice the data
        chunk = self.raw_data[self.current_index : self.current_index + chunk_size]
        self.current_index += chunk_size
        return chunk

# --- GLOBAL INSTANCE ---
# This loads the file only once when the script starts
streamer = DEAPStreamer()

def get_stress_level():
    """"""
    Calculates the Stress Score (0.0 - 1.0) using Alpha/Beta Ratio
    on the real loaded data.
    """""""
    # 1. Get Real Data Chunk (1 second)
    eeg_signal = streamer.get_next_chunk()
    
    # 2. Compute Power Spectral Density (PSD) using Welch's Method
    # fs=128 is critical for DEAP data
    freqs, psd = welch(eeg_signal, fs=128, nperseg=128)
    
    # 3. Extract Band Power
    # Alpha: 8 - 12 Hz
    # Beta:  13 - 30 Hz
    alpha_idx = np.where((freqs >= 8) & (freqs <= 12))[0]
    beta_idx = np.where((freqs >= 13) & (freqs <= 30))[0]
    
    alpha_power = np.sum(psd[alpha_idx])
    beta_power = np.sum(psd[beta_idx])
    
    # Safety check for division by zero
    if beta_power == 0: 
        return 0.5 
    
    # 4. Calculate Ratio
    ratio = alpha_power / beta_power
    
    # 5. Map Ratio to Stress Score (0.0 to 1.0)
    # Logic: 
    #   High Ratio (>1.0) = Relaxed -> Low Stress Score
    #   Low Ratio (<1.0)  = Stressed -> High Stress Score
    # Formula: Stress = 1 / (1 + Ratio)
    #   If Ratio = 5.0 (Very Relaxed), Stress = 0.16
    #   If Ratio = 0.2 (Panic), Stress = 0.83
    
    stress_score = 1 / (1 + ratio)
    
    # Optional: Print for debugging
    # print(f"Ratio: {ratio:.2f} | Stress: {stress_score:.2f}")
    
    return float(stress_score)
"""


import serial
import numpy as np
from scipy.signal import welch
import time

class EEGProcessor:
    def __init__(self, port='COM5', baud_rate=115200, sample_rate=256):
        """Initializes the connection to the Arduino UNO R4."""
        self.port = port
        self.baud_rate = baud_rate
        self.sample_rate = sample_rate
        self.buffer_size = sample_rate # 256 samples = 1 second of data
        
        try:
            self.serial_conn = serial.Serial(self.port, self.baud_rate, timeout=1)
            print(f"[N.I.R.V.A.N.A.] Connected to hardware on {self.port}")
            time.sleep(2) # Give Arduino time to reset
        except serial.SerialException as e:
            print(f"[Error] Could not connect to {self.port}. Is it plugged in?")
            self.serial_conn = None

    def capture_one_second_window(self):
        """Reads exactly 1 second of data from the Arduino."""
        if not self.serial_conn:
            return None

        eeg_buffer = []
        
        # Keep reading until we have 256 clean samples
        while len(eeg_buffer) < self.buffer_size:
            if self.serial_conn.in_waiting:
                try:
                    raw_line = self.serial_conn.readline().decode('utf-8').strip()
                    if "START_SESSION" in raw_line or not raw_line:
                        continue
                        
                    # Split CSV (Time, Value) and grab the Value
                    parts = raw_line.split(',')
                    if len(parts) == 2:
                        eeg_buffer.append(float(parts[1]))
                except ValueError:
                    # Catch garbled data during transmission
                    continue 
                    
        return np.array(eeg_buffer)

    def get_stress_index(self):
        """Captures data, runs FFT, and returns the Alpha/Beta ratio."""
        data = self.capture_one_second_window()
        if data is None:
            return 1.0 # Default fallback
            
        # Welch's method to extract frequencies
        freqs, psd = welch(data, fs=self.sample_rate, nperseg=len(data))
        
        # Isolate bands
        alpha_idx = np.where((freqs >= 8) & (freqs <= 12))
        beta_idx = np.where((freqs >= 13) & (freqs <= 30))
        
        alpha_power = np.mean(psd[alpha_idx])
        beta_power = np.mean(psd[beta_idx])
        
        if beta_power == 0:
            return 1.0
            
        alpha_beta_ratio = alpha_power / beta_power
        return alpha_beta_ratio
