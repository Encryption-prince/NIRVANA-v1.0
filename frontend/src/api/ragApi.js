import axios from 'axios'

const RAG_ANALYZE_URL =
  import.meta.env.VITE_RAG_API_URL ??
  'https://qlsr90x2-8080.inc1.devtunnels.ms/api/nirvana/analyze'

const ragClient = axios.create({
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 90_000,
})

/**
 * Normalize varied RAG response shapes into { summary, recommendations, raw }.
 */
export function normalizeRagResponse(data) {
  if (!data || typeof data !== 'object') {
    return { summary: String(data ?? ''), recommendations: [], raw: data }
  }

  const summary =
    data.summary ??
    data.insight ??
    data.insights ??
    data.analysis ??
    data.message ??
    data.response ??
    data.text ??
    null

  let recommendations = data.recommendations ?? data.suggestions ?? data.tips ?? []
  if (typeof recommendations === 'string') {
    recommendations = [recommendations]
  }
  if (!Array.isArray(recommendations) && recommendations) {
    recommendations = [String(recommendations)]
  }

  const nested = data.result ?? data.data
  if (!summary && nested && typeof nested === 'object') {
    return normalizeRagResponse(nested)
  }

  return {
    summary: summary ? String(summary) : null,
    recommendations: recommendations.map(String).filter(Boolean),
    raw: data,
  }
}

/**
 * POST /api/nirvana/analyze — stressScore omitted until RAG supports it.
 */
export async function analyzeWithRag({ alpha, beta, theta, stressScore }) {
  const body = { alpha, beta, theta }
  if (stressScore != null && stressScore !== '') {
    body.stressScore = stressScore
  }

  const { data } = await ragClient.post(RAG_ANALYZE_URL, body)
  return normalizeRagResponse(data)
}

export function getRagAnalyzeUrl() {
  return RAG_ANALYZE_URL
}
