import numpy as np
import pickle
import os

class QLearningAgent:
    def __init__(self, learning_rate=0.1, discount_factor=0.9, epsilon=0.2):
        # The Actions: 0=Ambient, 1=LoFi, 2=Classical
        self.actions = [0, 1, 2] 
        self.lr = learning_rate
        self.gamma = discount_factor
        self.epsilon = epsilon  # 20% chance to explore random genres
        
        self.q_table_file = "q_table.pkl"
        self.q_table = self.load_brain()

    def load_brain(self):
        if os.path.exists(self.q_table_file):
            print("[RL] Loading existing Q-Table brain...")
            with open(self.q_table_file, 'rb') as f:
                return pickle.load(f)
        else:
            print("[RL] Creating PRE-FILLED Q-Table brain.")
            # Create zeros
            q_table = np.zeros((11, len(self.actions)))
            
            # --- INJECT COMMON SENSE ---
            # For Low Stress (States 0-3), prefer Classical (Action 2)
            for s in range(4):
                q_table[s, 2] = 5.0 # Give it a head start score
                
            # For Medium Stress (States 4-6), prefer LoFi (Action 1)
            for s in range(4, 7):
                q_table[s, 1] = 5.0
                
            # For High Stress (States 7-10), prefer Ambient (Action 0)
            for s in range(7, 11):
                q_table[s, 0] = 5.0
                
            return q_table

    def save_brain(self):
        with open(self.q_table_file, 'wb') as f:
            pickle.dump(self.q_table, f)

    def get_state(self, raw_alpha_beta_ratio):
        # 1. Prevent division by zero
        if raw_alpha_beta_ratio <= 0.01:
            raw_alpha_beta_ratio = 0.01
            
        # 2. Invert it: Beta / Alpha (Higher = More Beta = More Stressed)
        stress_metric = 1.0 / raw_alpha_beta_ratio
        
        # 3. Clamp it between 0.0 (Zen) and 1.0 (Panic)
        # Assuming a Beta/Alpha ratio above 2.0 is maximum measurable stress
        normalized_stress = min(1.0, stress_metric / 2.0) 
        
        # 4. Return safe state index (0 to 10)
        return int(round(normalized_stress * 10))

    def choose_action(self, stress_score):
        state = self.get_state(stress_score)
        
        # Exploration (Random) vs Exploitation (Best Known)
        if np.random.uniform() < self.epsilon:
            action = np.random.choice(self.actions)
            print(f"[RL] Exploring! Random Action: {action}")
        else:
            action = np.argmax(self.q_table[state, :])
            print(f"[RL] Exploiting! Best Known Action: {action}")
            
        return action

    def learn(self, old_stress, action, new_stress):
        state = self.get_state(old_stress)
        next_state = self.get_state(new_stress)
        
        # Reward Logic: Did stress go down?
        diff = old_stress - new_stress
        if diff > 0.05:
            reward = 10   # Great job
        elif diff < -0.05:
            reward = -10  # Failed (Stress went up)
        else:
            reward = -1   # Neutral
            
        # Update Q-Table
        predict = self.q_table[state, action]
        target = reward + self.gamma * np.max(self.q_table[next_state, :])
        self.q_table[state, action] += self.lr * (target - predict)
        
        self.save_brain()
        print(f"[RL] Learned: State {state} -> Action {action} -> Reward {reward}")

    def get_prompt_from_action(self, action_index):
        # Map the index (0,1,2) to actual text prompts
        prompts = {
            0: "Ambient drone, meditative, very slow tempo, deep bass, therapeutic, 60 bpm",
            1: "Lo-fi hip hop, chill vibes, soft piano, relaxing, slow beat, 80 bpm",
            2: "Cinematic classical, orchestral, emotional, uplifting, flowing, 100 bpm"
        }
        return prompts[action_index]