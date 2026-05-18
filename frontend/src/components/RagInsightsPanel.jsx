import ReactMarkdown from 'react-markdown'

const RAG_COPY = {
  idle: {
    title: 'Session insights',
    body: 'Start a session to stream EEG data. Personalized RAG insights will appear here after analysis.',
  },
  processing: {
    title: 'Analyzing your session',
    body: 'Sending alpha, beta, and theta bands to the RAG service…',
  },
  ready: {
    title: 'Your insights',
    body: null,
  },
  error: {
    title: 'Insights unavailable',
    body: null,
  },
}

export default function RagInsightsPanel({ status, insights, error, onRetry }) {
  // Extract the text depending on how your backend sends it (string vs object)
  const insightText = typeof insights === 'string' 
    ? insights 
    : insights?.summary || insights?.content || insights?.recommendations || null;

  return (
    <section className="panel rag-panel" aria-labelledby="rag-heading">
      <header className="panel-header">
        <h2 id="rag-heading">Neuro-Adaptive Insights</h2>
        {status === 'processing' && <span className="badge badge-processing">Processing...</span>}
        {status === 'ready' && <span className="badge badge-live">Live</span>}
      </header>

      <div className="panel-body">
        {status === 'idle' && !insights && (
          <p className="rag-placeholder">
            Waiting for stable EEG telemetry to generate initial clinical insights...
          </p>
        )}

        {status === 'processing' && !insights && (
          <div className="rag-loading-state">
            <div className="rag-pulse-ring"></div>
            <p>Analyzing band power ratios...</p>
          </div>
        )}

        {error && (
          <div className="rag-error-state">
            <p className="error-text">⚠️ {error}</p>
            {onRetry && (
              <button className="btn btn-ghost" onClick={onRetry}>
                Retry Analysis
              </button>
            )}
          </div>
        )}

        {/* The Magic: ReactMarkdown automatically converts **text** to bold, # to headers, etc. */}
        {insightText && (
          <div className={`rag-content markdown-body ${status === 'processing' ? 'is-updating' : ''}`}>
            <ReactMarkdown>
              {insightText}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </section>
  )
}
