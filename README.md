# 🎧 N.I.R.V.A.N.A.
### Neural-Integrated Real-time Variational Audio for Neurological Alleviation


Stress and cognitive overload are now more common in digital environments, emphasizing the need for intelligent and personalized tools for relaxation. **N.I.R.V.A.N.A** is a closed-loop brain–computer interface (BCI) system that uses electroencephalogram (EEG) signals to create adaptive and algorithmic music tailored for stress reduction. 

---

## ✨ Key Features

*   🧠 **Relative-Calibration Stress Detection**: Continuously analyzes neural activity, extracting alpha (8-13 Hz) and beta (13-30 Hz) power densities to estimate the user’s cognitive state relative to a personalized 60-second baseline.
*   🎼 **Adaptive AI Music Generation**: Translates neural state vectors into high-dimensional musical parameters such as tempo, scale, octave, and note density. For instance, if stress levels are high, the system automatically produces music with a slower tempo, softer melody movements, and a gentler rhythm.
*   🤖 **Closed-Loop MDP Framework**: A Deep Q-Network (DQN) based reinforcement learning agent models the neurofeedback interaction as a Markov Decision Process (MDP). It uses a domain-specific reward function to encourage music generation that progressively changes brain activity towards a state of relaxation.
*   🩺 **Clinical Text Feedback via RAG**: Delivers real-time, evidence-based text feedback regarding the user's neurological state. It maps physiological metrics into semantic queries using a Qdrant vector database and a quantized LLM (Llama 3.1 8B) to generate scientifically validated clinical logs without hallucination.
*   ⚡ **Ultra-Low Latency**: Hardware acquisition, FFT signal processing, and Q-table inference execute rapidly in under 1.2 seconds, satisfying strict real-time BCI requirements. Generative audio is synthesized asynchronously in 5-second chunks using models like MusicGen or VAEs.

---

## 🏗️ System Architecture

1.  **EEG Acquisition**: Evaluated using the DEAP dataset (32-channel EEG downsampled to 128 Hz) and adaptable for live sensors. 
2.  **Signal Processing**: Cleans raw brain signals using a 5th-order Butterworth band-pass filter (0.5–45 Hz) and a 50 Hz notch filter to remove power-line interference. Features are extracted via Welch's Method to compute the Power Spectral Density (PSD).
3.  **Stress Detection**: Calculates the beta-to-alpha power ratio to categorize mental states into low, moderate, or high stress.
4.  **Generative Audio Playback**: Adjusts structural parameters (tempo, rhythm, harmony) to steer a generative deep learning model. The feedback loop continuously re-evaluates the resulting EEG shifts to fine-tune the music.

---

## 📊 Dataset & Validation

The system's framework is validated using the **DEAP Dataset** (Database for Emotion Analysis Using Physiological Signals). 
*   **Live Pilot Studies (N=1)**: The BCI system successfully captured transient EEG artifacts and maintained user stress indexes within a stabilized band (4.0 to 8.0) during AI audio interventions.
*   **RL Convergence**: The Q-Learning algorithm successfully learned to deploy ambient music to counter high-stress states and classical music to maintain relaxed states.

---

## 👥 Contributors

This research and framework were developed at the Department of Information Technology, Techno Main Salt Lake (Kolkata, India) by:
*   **Subham Maity**
*   **Subha Deep Mishra**
*   **Supratim Das**
*   **Sruti Sarkar**
*   **Subhamita Mukherjee**
```