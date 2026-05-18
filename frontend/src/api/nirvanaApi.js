import { apiClient } from './client'

/** GET / — health check */
export async function getHealth() {
  const { data } = await apiClient.get('/')
  return data
}

// START session (Now accepts personId)
export async function startSession(personId = "default_user") {
  const { data } = await apiClient.post('/start-session', {
    person_id: personId
  })
  return data
}

/** POST /stop-session */
export async function stopSession() {
  const { data } = await apiClient.post('/stop-session')
  return data
}

/** GET /current-stress */
export async function getCurrentStress() {
  const { data } = await apiClient.get('/current-stress')
  return data
}

/** GET /current-music — returns a Blob (audio/wav) */
export async function getCurrentMusic() {
  const { data } = await apiClient.get('/current-music', {
    responseType: 'blob',
  })
  return data
}

/** GET /persons */
export async function getPersons() {
  const { data } = await apiClient.get('/persons')
  return data
}

/** GET /history/{personId} */
export async function getPersonHistory(personId, sessionIndex = -1) {
  const { data } = await apiClient.get(`/history/${personId}`, {
    params: { session_index: sessionIndex },
  })
  return data
}
