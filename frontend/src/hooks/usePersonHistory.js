import { useCallback, useEffect, useRef, useState } from 'react'
import { getPersonHistory, getPersons } from '../api/nirvanaApi'

function getErrorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail
    return typeof detail === 'string' ? detail : JSON.stringify(detail)
  }
  return error.message || 'Failed to load history.'
}

export function usePersonHistory() {
  const [persons, setPersons] = useState([])
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [sessionIndex, setSessionIndexState] = useState(-1)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadHistory = useCallback(async (personId, index) => {
    if (!personId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getPersonHistory(personId, index)
      if (mountedRef.current) setHistory(data)
    } catch (err) {
      if (mountedRef.current) {
        setHistory(null)
        setError(getErrorMessage(err))
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getPersons()
      .then((data) => {
        if (cancelled) return
        const list = data.persons ?? []
        setPersons(list)
        if (list.length > 0) {
          const firstId = list[0].id
          setSelectedPersonId(firstId)
          loadHistory(firstId, -1)
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err))
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [loadHistory])

  const selectPerson = useCallback(
    (personId) => {
      setSelectedPersonId(personId)
      setSessionIndexState(-1)
      loadHistory(personId, -1)
    },
    [loadHistory],
  )

  const setSessionIndex = useCallback(
    (index) => {
      setSessionIndexState(index)
      if (selectedPersonId) loadHistory(selectedPersonId, index)
    },
    [selectedPersonId, loadHistory],
  )

  return {
    persons,
    selectedPersonId,
    sessionIndex,
    setSessionIndex,
    selectPerson,
    history,
    loading,
    error,
    reload: () => selectedPersonId && loadHistory(selectedPersonId, sessionIndex),
  }
}
