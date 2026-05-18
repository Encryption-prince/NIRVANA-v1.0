import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function QLearningChart({ qLearning }) {
  if (!qLearning?.labels?.length) return null

  const data = qLearning.labels.map((label, i) => ({
    label,
    relaxed: qLearning.relaxed_state[i],
    stressed: qLearning.stressed_state[i],
  }))

  return (
    <div className="chart-card">
      <h3>Q-learning action selection</h3>
      <p className="chart-subtitle">Expected reward by neurological state</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--text-h)', fontSize: 12 }} />
          <YAxis
            tick={{ fill: 'var(--text)', fontSize: 12 }}
            label={{ value: 'Q-value', angle: -90, position: 'insideLeft', offset: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          />
          <Legend />
          <Bar
            dataKey="relaxed"
            name={qLearning.relaxed_label}
            fill="#7dd3fc"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="stressed"
            name={qLearning.stressed_label}
            fill="#fb7185"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
