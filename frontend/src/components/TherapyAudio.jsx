import { useEffect, useRef, useState } from 'react'

export default function TherapyAudio({ musicUrl, sessionActive, onRefresh, loading }) {
  // The "DJ Decks" - Two audio elements to handle the seamless crossfade
  const audio1Ref = useRef(null)
  const audio2Ref = useRef(null)

  const [activePlayer, setActivePlayer] = useState(1)
  const [statusText, setStatusText] = useState('Waiting for session...')

  useEffect(() => {
    if (!sessionActive) {
      setStatusText('Start a session to generate adaptive therapy audio.')
      if (audio1Ref.current) audio1Ref.current.pause()
      if (audio2Ref.current) audio2Ref.current.pause()
      return
    }

    if (!musicUrl) {
      setStatusText('Generating your first therapy clip… this takes ~15 seconds.')
      return
    }

    // Determine which deck is currently playing, and which is standing by
    const currentAudio = activePlayer === 1 ? audio1Ref.current : audio2Ref.current
    const nextAudio = activePlayer === 1 ? audio2Ref.current : audio1Ref.current
    const nextPlayerIndex = activePlayer === 1 ? 2 : 1

    setStatusText('Smoothly transitioning to next track...')

    // Prepare the new track in the background
    nextAudio.src = musicUrl
    nextAudio.volume = 0
    nextAudio.loop = true

    // Play the new track silently, then fade it in
    nextAudio.play().then(() => {
      setStatusText('🎶 Playing Adaptive Therapy Loop')
      
      // The Crossfade (2 seconds total duration)
      let volume = 0
      const fadeInterval = setInterval(() => {
        volume += 0.05
        
        if (volume >= 1) {
          volume = 1
          clearInterval(fadeInterval)
          
          // Completely kill the old track to save memory & CPU
          currentAudio.pause()
          currentAudio.removeAttribute('src') 
          currentAudio.load() 
        }
        
        nextAudio.volume = volume
        // Math.max prevents error if volume goes slightly below 0 due to float math
        currentAudio.volume = Math.max(0, 1 - volume) 
      }, 100)

      setActivePlayer(nextPlayerIndex)
    }).catch((err) => {
      console.error("Browser autoplay policy blocked the audio:", err)
      setStatusText('🔇 Please interact with the page to allow audio playback')
    })

  }, [musicUrl, sessionActive])

  return (
    <section className="panel audio-panel" aria-labelledby="audio-heading">
      <header className="panel-header">
        <h2 id="audio-heading">Therapy loop</h2>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onRefresh}
          disabled={!sessionActive || loading}
        >
          Refresh
        </button>
      </header>
      
      <div className="audio-player-container" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', margin: '1rem 0' }}>
        {/* Hidden audio elements managed by React Refs */}
        <audio ref={audio1Ref} preload="auto" />
        <audio ref={audio2Ref} preload="auto" />
        
        <p className={musicUrl ? "audio-active" : "audio-placeholder"} style={{ fontWeight: '500', margin: 0 }}>
          {statusText}
        </p>
      </div>
    </section>
  )
}