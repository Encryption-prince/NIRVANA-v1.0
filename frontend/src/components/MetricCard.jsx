const BAND_META = {
  alpha: { label: 'Alpha', unit: 'µV² rel.', color: '#8b5cf6' },
  beta: { label: 'Beta', unit: 'µV² rel.', color: '#3b82f6' },
  theta: { label: 'Theta', unit: 'µV² rel.', color: '#14b8a6' },
  stress_score: { label: 'Stress score', unit: '0–1 scale', color: '#f59e0b' },
}

export default function MetricCard({ band, value, subtitle }) {
  const meta = BAND_META[band] ?? { label: band, unit: '', color: 'var(--accent)' }

  return (
    <article className="metric-card" style={{ '--metric-accent': meta.color }}>
      <div className="metric-card__glow" aria-hidden="true" />
      <p className="metric-card__label">{meta.label}</p>
      <p className="metric-card__value">{typeof value === 'number' ? value.toFixed(3) : '—'}</p>
      <p className="metric-card__unit">{meta.unit}</p>
      {subtitle && <p className="metric-card__sub">{subtitle}</p>}
    </article>
  )
}
