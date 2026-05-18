export default function ImprovementHero({ improvement }) {
  if (!improvement) return null

  const pct = improvement.stress_reduction_pct ?? 0
  const positive = pct >= 0
  const clamped = Math.min(100, Math.max(0, Math.abs(pct)))
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (clamped / 100) * circumference

  return (
    <section className="improvement-hero" aria-labelledby="improvement-heading">
      <div className="improvement-hero__ring-wrap">
        <svg className="improvement-ring" viewBox="0 0 120 120" role="img" aria-label={`${pct}% stress reduction`}>
          <circle className="improvement-ring__track" cx="60" cy="60" r="54" />
          <circle
            className={`improvement-ring__progress ${positive ? 'is-positive' : 'is-negative'}`}
            cx="60"
            cy="60"
            r="54"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="improvement-hero__center">
          <span className={`improvement-hero__pct ${positive ? 'is-positive' : 'is-negative'}`}>
            {positive ? '+' : ''}
            {pct.toFixed(1)}%
          </span>
          <span className="improvement-hero__label">Stress reduction</span>
        </div>
      </div>

      <div className="improvement-hero__details">
        <h2 id="improvement-heading">Therapy impact</h2>
        <p>
          Comparing pre-intervention baseline (avg{' '}
          <strong>{improvement.pre_stress_avg}</strong>) to post-therapy window (avg{' '}
          <strong>{improvement.post_stress_avg}</strong>) at{' '}
          <strong>{improvement.intervention_at_sec}s</strong>.
        </p>
        <dl className="improvement-deltas">
          <div>
            <dt>Alpha</dt>
            <dd className={deltaClass(improvement.alpha_change_pct)}>{fmtDelta(improvement.alpha_change_pct)}</dd>
          </div>
          <div>
            <dt>Beta</dt>
            <dd className={deltaClass(improvement.beta_change_pct)}>{fmtDelta(improvement.beta_change_pct)}</dd>
          </div>
          <div>
            <dt>Theta</dt>
            <dd className={deltaClass(improvement.theta_change_pct)}>{fmtDelta(improvement.theta_change_pct)}</dd>
          </div>
          <div>
            <dt>Stress score</dt>
            <dd className={deltaClass(improvement.stress_score_change_pct)}>
              {fmtDelta(improvement.stress_score_change_pct)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

function fmtDelta(value) {
  if (value == null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}%`
}

function deltaClass(value) {
  if (value == null) return ''
  return value >= 0 ? 'delta-up' : 'delta-down'
}
