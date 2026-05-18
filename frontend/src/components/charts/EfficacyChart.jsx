import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function buildChartData(efficacy) {
  return efficacy.time_seconds.map((t, i) => ({
    time: t,
    raw: efficacy.raw_stress[i],
    smoothed: efficacy.smoothed_stress[i],
  }))
}

export default function EfficacyChart({ efficacy }) {
  if (!efficacy?.time_seconds?.length) return null

  const data = buildChartData(efficacy)
  const intervention = efficacy.intervention_at_sec
  const end = efficacy.session_end_sec

  return (
    <div className="chart-card">
      <h3>System efficacy</h3>
      <p className="chart-subtitle">Stress index reduction over time (therapy window shaded)</p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
          <XAxis
            dataKey="time"
            label={{ value: 'Session time (s)', position: 'insideBottom', offset: -4 }}
            tick={{ fill: 'var(--text)', fontSize: 12 }}
          />
          <YAxis
            label={{ value: 'Stress index', angle: -90, position: 'insideLeft', offset: 12 }}
            tick={{ fill: 'var(--text)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          />
          <Legend />
          <ReferenceArea
            x1={intervention}
            x2={end}
            fill="#22c55e"
            fillOpacity={0.12}
            label={{ value: 'Therapy active', position: 'insideTopRight', fill: '#16a34a' }}
          />
          <ReferenceLine
            x={intervention}
            stroke="#ef4444"
            strokeDasharray="6 4"
            label={{ value: 'Intervention', fill: '#ef4444', fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="raw"
            name="Raw β/α ratio"
            stroke="#9ca3af"
            strokeWidth={1}
            dot={false}
            opacity={0.45}
          />
          <Line
            type="monotone"
            dataKey="smoothed"
            name="Smoothed trend"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
