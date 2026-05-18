import { useState } from 'react'
import { getApiBaseUrl } from '../api/client'
import { getRagAnalyzeUrl } from '../api/ragApi'
import LiveMetrics from '../components/LiveMetrics'
import RagInsightsPanel from '../components/RagInsightsPanel'
import TherapyAudio from '../components/TherapyAudio'
import { useNirvanaSession } from '../hooks/useNirvanaSession'

export default function StartSession() {
  const {
    backendOnline,
    sessionActive,
    metrics,
    sessionMessage,
    musicUrl,
    loading,
    error,
    ragStatus,
    ragInsights,
    ragError,
    startSession, 
    stopSession,
    refreshMusic,
    requestRagInsights,
  } = useNirvanaSession()

  const [personId, setPersonId] = useState('default_user')

  const handleRagRetry = () => {
    if (metrics) requestRagInsights(metrics, { force: true })
  }

  return (
    <div className="start-session">
      <header className="page-header">
        <p className="eyebrow">N.I.R.V.A.N.A.</p>
        <h1>Live Session Context</h1>
        <p className="page-lead">
          Connect to the ML backend, stream live EEG bands, and receive personalized AI therapy insights in real-time.
        </p>
        <div className="api-status-group" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <p className="api-hint" style={{ margin: 0 }}>
            <strong>ML Engine:</strong> <code>{getApiBaseUrl()}</code>
            {backendOnline === true && <span className="status-dot status-dot--ok" title="Online" style={{ marginLeft: '8px' }} />}
            {backendOnline === false && <span className="status-dot status-dot--err" title="Offline" style={{ marginLeft: '8px' }} />}
          </p>
          <p className="api-hint" style={{ margin: 0 }}>
            <strong>RAG Inference:</strong> <code>{getRagAnalyzeUrl()}</code>
          </p>
        </div>
      </header>

      {/* System Alerts */}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {sessionMessage && (
        <div className="alert alert-info" role="status" style={{ marginBottom: '1rem' }}>
          {sessionMessage}
        </div>
      )}

      {/* Consolidated Session Configuration Panel */}
      <section className="panel control-panel" aria-labelledby="control-heading" style={{ marginBottom: '2rem' }}>
        <header className="panel-header">
          <h2 id="control-heading">Session Configuration</h2>
        </header>

        <div className="panel-body" style={{ padding: '1.5rem' }}>
          {!sessionActive && (
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="personId" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#444' }}>
                Subject Identifier
              </label>
              <input
                id="personId"
                type="text"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                disabled={loading}
                placeholder="e.g., Subject_01 or Name"
                style={{ 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  border: '1px solid #ccc', 
                  width: '100%', 
                  maxWidth: '350px',
                  fontSize: '1rem',
                  backgroundColor: '#fafafa',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  color: '#333',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                onBlur={(e) => e.target.style.borderColor = '#ccc'}
              />
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
                This identifier is required to accurately track and graph cross-session history.
              </small>
            </div>
          )}

          <div className="button-group">
            {!sessionActive ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => startSession(personId)}
                disabled={loading || !personId.trim()}
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 'bold' }}
              >
                {loading ? 'Initializing Pipeline…' : 'Start BCI Session'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger"
                onClick={stopSession}
                disabled={loading}
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 'bold' }}
              >
                {loading ? 'Disconnecting Hardware…' : 'Stop Session & Save Data'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Telemetry Dashboard */}
      <div className="session-grid">
        <LiveMetrics sessionActive={sessionActive} metrics={metrics} />
        <TherapyAudio
          musicUrl={musicUrl}
          sessionActive={sessionActive}
          onRefresh={refreshMusic}
          loading={loading}
        />
        <RagInsightsPanel
          status={ragStatus}
          insights={ragInsights}
          error={ragError}
          onRetry={metrics ? handleRagRetry : undefined}
        />
      </div>
    </div>
  )
}