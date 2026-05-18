import EfficacyChart from '../components/charts/EfficacyChart'
import LatencyChart from '../components/charts/LatencyChart'
import QLearningChart from '../components/charts/QLearningChart'
import ImprovementHero from '../components/ImprovementHero'
import MetricCard from '../components/MetricCard'
import { usePersonHistory } from '../hooks/usePersonHistory'
import './SessionHistory.css'

export default function SessionHistory() {
  const {
    persons,
    selectedPersonId,
    sessionIndex,
    setSessionIndex,
    selectPerson,
    history,
    loading,
    error,
  } = usePersonHistory()

  const metrics = history?.metrics?.session_average
  const sessionCount = history?.person?.session_count ?? 1

  return (
    <div className="session-history">
      <header className="history-header">
        <div>
          <p className="eyebrow">N.I.R.V.A.N.A. Analytics</p>
          <h1>Subject History Dashboard</h1>
          <p className="page-lead">
            Review historical EEG band power, neuro-adaptive stress trends, and therapy outcomes across recorded sessions.
          </p>
        </div>

        <div className="history-controls">
          <label className="control-field">
            <span style={{ fontWeight: '600', color: '#555' }}>Active Subject</span>
            <select
              value={selectedPersonId ?? ''}
              onChange={(e) => selectPerson(e.target.value)}
              disabled={loading && !persons.length}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              {persons.length === 0 && <option value="">No subjects found</option>}
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.session_count} session{p.session_count !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </label>

          {sessionCount > 1 && (
            <label className="control-field">
              <span style={{ fontWeight: '600', color: '#555' }}>Session Timeline</span>
              <select
                value={sessionIndex}
                onChange={(e) => setSessionIndex(Number(e.target.value))}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                {Array.from({ length: sessionCount }, (_, i) => {
                  const idx = i - sessionCount
                  return (
                    <option key={idx} value={idx}>
                      {idx === -1 ? 'Latest Session' : `Session ${i + 1}`}
                    </option>
                  )
                })}
              </select>
            </label>
          )}
        </div>
      </header>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {loading && !history && (
        <div className="history-loading" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
          <div className="history-loading__spinner" />
          <p>Compiling subject neuro-history…</p>
        </div>
      )}

      {history && (
        <>
          <div className="session-meta" style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '2rem', fontWeight: '500' }}>
            <span style={{ color: '#0066cc' }}>Subject: {history.person.name}</span>
            <span aria-hidden="true" style={{ margin: '0 10px', color: '#ccc' }}>|</span>
            <span>File: <code style={{ fontSize: '0.85em', background: '#e9ecef', padding: '2px 6px', borderRadius: '4px' }}>{history.session.file}</code></span>
            <span aria-hidden="true" style={{ margin: '0 10px', color: '#ccc' }}>|</span>
            <span>Duration: {history.session.duration_sec} seconds</span>
          </div>

          <section className="metrics-row" aria-label="Session averages">
            <MetricCard band="alpha" value={metrics?.alpha} subtitle="Session Avg Power" />
            <MetricCard band="beta" value={metrics?.beta} subtitle="Session Avg Power" />
            <MetricCard band="theta" value={metrics?.theta} subtitle="Session Avg Power" />
            
            {/* FIXED: Now pulling the correct 'stress_ratio' from your 5-column CSV data */}
            <MetricCard band="stress_ratio" value={metrics?.stress_ratio} subtitle="Alpha/Beta Ratio" />
          </section>

          <ImprovementHero improvement={history.improvement} />

          <section className="charts-grid" aria-label="Analytics">
            <EfficacyChart efficacy={history.charts.efficacy} />
            <LatencyChart latency={history.charts.latency} />
            <QLearningChart qLearning={history.charts.q_learning} />
          </section>
        </>
      )}
    </div>
  )
}