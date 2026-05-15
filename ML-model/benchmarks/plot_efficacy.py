import pandas as pd
import matplotlib.pyplot as plt

# 1. Load your newly recorded data
data = pd.read_csv("benchmarks/my_session_data.csv")

# 2. Smooth the data (10-second rolling average)
data['Smoothed_Stress'] = data['Stress_Ratio'].rolling(window=10).mean()

# 3. Create the plot
plt.figure(figsize=(10, 5))
plt.plot(data['Time_Seconds'], data['Stress_Ratio'], color='gray', alpha=0.3, label='Raw Beta/Alpha Ratio')
plt.plot(data['Time_Seconds'], data['Smoothed_Stress'], color='blue', linewidth=2, label='Smoothed Trend')

# 4. Add Intervention Shading (Change '180' to exactly when the music started playing for you)
plt.axvline(x=180, color='red', linestyle='--', label='Music Intervention Started')
plt.axvspan(180, data['Time_Seconds'].max(), color='green', alpha=0.1, label='Therapy Active')

# 5. Styling
plt.title('N.I.R.V.A.N.A. System Efficacy: Stress Index Reduction over Time', fontsize=14)
plt.xlabel('Session Time (Seconds)', fontsize=12)
plt.ylabel('Calculated Stress Index', fontsize=12)
plt.legend(loc='upper right')
plt.grid(True, linestyle=':', alpha=0.6)

plt.tight_layout()
plt.savefig('efficacy_graph.png', dpi=300)
print("Graph saved as efficacy_graph.png")
plt.show()