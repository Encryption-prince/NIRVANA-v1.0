function formatValue(value) {
  if (value == null) return '—'
  return typeof value === 'number' ? value.toFixed(3) : String(value)
}

export default function LiveMetrics({ sessionActive, metrics }) {
  return (
    <section className="panel metrics-panel" aria-labelledby="metrics-heading">
      <header className="panel-header">
        <h2 id="metrics-heading">Live EEG metrics</h2>
        <span className={`badge ${sessionActive ? 'badge-live' : 'badge-off'}`}>
          {sessionActive ? 'Live' : 'Idle'}
        </span>
      </header>
      <dl className="metrics-grid metrics-grid--bands">
        <div>
          <dt>Alpha</dt>
          <dd className="metric-value">{formatValue(metrics?.alpha)}</dd>
        </div>
        <div>
          <dt>Beta</dt>
          <dd className="metric-value">{formatValue(metrics?.beta)}</dd>
        </div>
        <div>
          <dt>Theta</dt>
          <dd className="metric-value">{formatValue(metrics?.theta)}</dd>
        </div>
        <div>
          <dt>Stress ratio</dt>
          <dd className="metric-value">{formatValue(metrics?.stress_ratio)}</dd>
        </div>
      </dl>
    </section>
  )
}
