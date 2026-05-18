import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCurrentStress,
  getCurrentMusic,
  getHealth,
  startSession as apiStartSession,
  stopSession as apiStopSession,
} from '../api/nirvanaApi'
import { analyzeWithRag } from '../api/ragApi'

const STRESS_POLL_MS = 2000
const MUSIC_POLL_MS = 15000
const RAG_MIN_INTERVAL_MS = 30_000

function getErrorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail
    return typeof detail === 'string' ? detail : JSON.stringify(detail)
  }
  if (error.response?.data?.message) return String(error.response.data.message)
  if (error.message) return error.message
  return 'Something went wrong. Check that the ML backend is running.'
}

function getRagErrorMessage(error) {
  if (error.response?.status === 404) {
    return 'RAG service not reachable. Confirm the dev tunnel is running.'
  }
  if (error.code === 'ECONNABORTED') {
    return 'RAG analysis timed out. Try again when the service is ready.'
  }
  return getErrorMessage(error)
}

function hasValidBands(metrics) {
  return (
    metrics &&
    Number.isFinite(metrics.alpha) &&
    Number.isFinite(metrics.beta) &&
    Number.isFinite(metrics.theta)
  )
}

export function useNirvanaSession() {
  const [backendOnline, setBackendOnline] = useState(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [sessionMessage, setSessionMessage] = useState(null)
  const [musicUrl, setMusicUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ragStatus, setRagStatus] = useState('idle')
  const [ragInsights, setRagInsights] = useState(null)
  const [ragError, setRagError] = useState(null)
  const musicUrlRef = useRef(null)
  const lastRagCallRef = useRef(0)
  const ragInFlightRef = useRef(false)
  const prevGenCountRef = useRef(0)

  const revokeMusicUrl = useCallback(() => {
    if (musicUrlRef.current) {
      URL.revokeObjectURL(musicUrlRef.current)
      musicUrlRef.current = null
    }
    setMusicUrl(null)
  }, [])

  const requestRagInsights = useCallback(async (bandMetrics, { force = false } = {}) => {
    if (!hasValidBands(bandMetrics)) return
    const now = Date.now()
    if (!force && now - lastRagCallRef.current < RAG_MIN_INTERVAL_MS) return
    if (ragInFlightRef.current) return

    ragInFlightRef.current = true
    lastRagCallRef.current = now
    setRagStatus('processing')
    setRagError(null)

    try {
      const insights = await analyzeWithRag({
        alpha: bandMetrics.alpha,
        beta: bandMetrics.beta,
        theta: bandMetrics.theta,
        // stressScore: bandMetrics.stress_score, — enable when RAG accepts it
      })
      setRagInsights(insights)
      setRagStatus(insights.summary || insights.recommendations.length ? 'ready' : 'processing')
    } catch (err) {
      setRagError(getRagErrorMessage(err))
      setRagStatus('error')
    } finally {
      ragInFlightRef.current = false
    }
  }, [])

  const refreshStress = useCallback(async () => {
    try {
      const data = await getCurrentStress()
      setMetrics({
        alpha: data.alpha,
        beta: data.beta,
        theta: data.theta,
        stress_ratio: data.stress_ratio,
        stress_score: data.stress_score,
      })
      setSessionActive(data.is_active)

      // If the backend counter is higher than our frontend counter, 
      // a new song has started generating. Fire RAG instantly!
      if (data.generation_count > prevGenCountRef.current) {
        prevGenCountRef.current = data.generation_count;
        requestRagInsights(data, { force: true });
      }

      return data
    } catch (err) {
      setError(getErrorMessage(err))
      return null
    }
  }, [requestRagInsights])

  const refreshMusic = useCallback(async () => {
    try {
      const blob = await getCurrentMusic()
      revokeMusicUrl()
      const url = URL.createObjectURL(blob)
      musicUrlRef.current = url
      setMusicUrl(url)
      setError(null)
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(getErrorMessage(err))
      }
    }
  }, [revokeMusicUrl])

  useEffect(() => {
    let cancelled = false
    getHealth()
      .then(() => {
        if (!cancelled) setBackendOnline(true)
      })
      .catch(() => {
        if (!cancelled) setBackendOnline(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sessionActive) return undefined

    const stressId = setInterval(refreshStress, STRESS_POLL_MS)
    const musicId = setInterval(refreshMusic, MUSIC_POLL_MS)
    const initialPollId = setTimeout(() => {
      refreshMusic()
    }, 0)

    return () => {
      clearInterval(stressId)
      clearInterval(musicId)
      clearTimeout(initialPollId)
    }
  }, [sessionActive, refreshStress, refreshMusic])

  useEffect(() => () => revokeMusicUrl(), [revokeMusicUrl])

  // Now accepts personId from your StartSession UI component
  const startSession = useCallback(async (personId = "default_user") => {
    setLoading(true)
    setError(null)
    setSessionMessage(null)
    setRagInsights(null)
    setRagError(null)
    setRagStatus('processing')
    lastRagCallRef.current = 0
    try {
      // Pass the ID down to nirvanaApi.js!
      const data = await apiStartSession(personId)
      
      setSessionMessage(data.status ?? 'Session started')
      setSessionActive(true)
      const live = await refreshStress()
      if (hasValidBands(live)) {
        requestRagInsights(live, { force: true })
      }
    } catch (err) {
      setRagStatus('idle')
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [refreshStress, requestRagInsights])

  const stopSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    const finalMetrics = metrics
    try {
      const data = await apiStopSession()
      setSessionMessage(data.status ?? 'Session stopped')
      setSessionActive(false)
      setMetrics(null)
      revokeMusicUrl()
      if (hasValidBands(finalMetrics)) {
        await requestRagInsights(finalMetrics, { force: true })
      } else {
        setRagStatus(ragInsights ? 'ready' : 'idle')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [metrics, revokeMusicUrl, requestRagInsights, ragInsights])

  return {
    backendOnline,
    sessionActive,
    metrics,
    stressScore: metrics?.stress_ratio ?? null,
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
    refreshStress,
    requestRagInsights,
  }
}
