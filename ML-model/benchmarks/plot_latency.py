import matplotlib.pyplot as plt

# System timing estimates (in milliseconds)
stages = [
    'Hardware Acquisition\n(Arduino)', 
    'Signal Processing\n(FFT/Scipy)', 
    'RL Inference\n(Q-Table)', 
    'Audio Generation\n(MusicGen)'
]
times_ms = [1000, 45, 2, 12000] # Adjust 12000ms based on your actual GPU/CPU speed

plt.figure(figsize=(8, 5))
bars = plt.barh(stages, times_ms, color=['#4CAF50', '#2196F3', '#FFC107', '#F44336'])

# Add the numbers next to the bars
for bar in bars:
    plt.text(bar.get_width() + 100, bar.get_y() + bar.get_height()/2, 
             f'{int(bar.get_width())} ms', 
             va='center', fontweight='bold')

plt.xlabel('Processing Time (milliseconds)')
plt.title('N.I.R.V.A.N.A. Closed-Loop Latency Breakdown')
plt.xlim(0, max(times_ms) * 1.2) # Give room for the text

plt.tight_layout()
plt.savefig('latency_graph.png', dpi=300)
print("Graph saved as latency_graph.png")
plt.show()