import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function LatencyChart({ latency }) {
  if (!latency?.stages?.length) return null

  const data = latency.stages.map((stage, i) => ({
    stage,
    ms: latency.times_ms[i],
    color: latency.colors[i],
  }))

  return (
    <div className="chart-card">
      <h3>Closed-loop latency</h3>
      <p className="chart-subtitle">End-to-end pipeline timing breakdown</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--text)', fontSize: 12 }}
            label={{ value: 'Processing time (ms)', position: 'insideBottom', offset: -4 }}
          />
          <YAxis
            type="category"
            dataKey="stage"
            width={160}
            tick={{ fill: 'var(--text-h)', fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [`${value} ms`, 'Duration']}
            contentStyle={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          />
          <Bar dataKey="ms" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry) => (
              <Cell key={entry.stage} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
