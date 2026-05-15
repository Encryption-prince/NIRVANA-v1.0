import pickle
import numpy as np
import matplotlib.pyplot as plt

# 1. Load your actual trained RL brain
# Adjust the path if your q_table.pkl is in the root directory
with open('q_table.pkl', 'rb') as f:
    q_table = pickle.load(f)

# 2. Extract specific states to prove it learned
# State 2 = Relaxed, State 8 = Highly Stressed
relaxed_state = q_table[2, :]
stressed_state = q_table[8, :]

# 3. Setup the bar chart
labels = ['Ambient (0)', 'LoFi (1)', 'Classical (2)']
x = np.arange(len(labels))
width = 0.35

fig, ax = plt.subplots(figsize=(8, 5))
rects1 = ax.bar(x - width/2, relaxed_state, width, label='State 2 (Relaxed Brain)', color='skyblue')
rects2 = ax.bar(x + width/2, stressed_state, width, label='State 8 (Stressed Brain)', color='salmon')

# 4. Styling
ax.set_ylabel('Q-Value (Expected Reward)')
ax.set_title('Q-Learning Action Selection Based on Neurological State')
ax.set_xticks(x)
ax.set_xticklabels(labels)
ax.legend()
plt.grid(axis='y', linestyle='--', alpha=0.7)

plt.tight_layout()
plt.savefig('q_learning_graph.png', dpi=300)
print("Graph saved as q_learning_graph.png")
plt.show()