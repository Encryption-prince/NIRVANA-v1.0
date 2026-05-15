import threading
import torch
import scipy.io.wavfile
from transformers import AutoProcessor, MusicgenForConditionalGeneration
import time

# IMPORT THE MODULES
from src.state_manager import shared_state
from src.rl_brain import QLearningAgent

class MusicGeneratorThread(threading.Thread):
    def __init__(self, output_queue, duration=15):
        super().__init__()
        self.duration = duration
        self.running = True
        
        # Init AI Models
        print("[AI] Loading MusicGen Model...")
        self.processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
        self.model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        print(f"[AI] Model loaded on {self.device}")
        
        # Init RL Agent
        self.agent = QLearningAgent()

    def run(self):
        file_count = 0
        
        # 1. Get Initial Live Stress from the thread-safe state manager
        current_stress = shared_state.get_stress() 
        current_action = self.agent.choose_action(current_stress)
        
        while self.running:
            # 2. Generate Music based on decision
            prompt = self.agent.get_prompt_from_action(current_action)
            print(f"\n[AI] Stress: {current_stress:.2f} | Action: {prompt}")
            
            inputs = self.processor(text=[prompt], padding=True, return_tensors="pt").to(self.device)
            
            # Generate Audio (Blocking Operation - takes ~10-15s)
            # NOTE: While this blocks, your api.py hardware thread is still secretly 
            # updating shared_state in the background every second!
            audio = self.model.generate(**inputs, max_new_tokens=int(self.duration * 50))
            
            filename = f"generated_clips/loop_{file_count}.wav"
            sampling_rate = self.model.config.audio_encoder.sampling_rate
            scipy.io.wavfile.write(filename, rate=sampling_rate, data=audio[0, 0].cpu().numpy())
            
            # 4. Update Shared State (Frontend starts playing it NOW)
            shared_state.set_latest_file(filename)
            
            # --- THE NEUROLOGICAL DELAY ---
            # Wait 10 seconds to let the music actually affect the user's brain
            print("[AI] Music playing. Waiting 10s for brainwave sync...")
            time.sleep(20) 
            
            # 5. READ NEW DATA 
            # Because we waited, this is now a true reflection of the music's effect!
            new_stress = shared_state.get_stress()
            
            # 6. RL Learning Step
            self.agent.learn(current_stress, current_action, new_stress)
            
            # 7. Prepare next loop
            current_action = self.agent.choose_action(new_stress)
            current_stress = new_stress
            file_count += 1