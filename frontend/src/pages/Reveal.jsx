import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import { getApiUrl } from '../utils/config'

export default function Reveal() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('roomCode')
  const playerId = searchParams.get('playerId')
  const playerName = searchParams.get('playerName')
  const hostId = searchParams.get('hostId')

  const [role, setRole] = useState(null)
  const [word, setWord] = useState(null)
  const [category, setCategory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingRevealed, setIsMarkingRevealed] = useState(false)

  useEffect(() => {
    if (!roomCode || !playerId) return

    fetchPlayerInfo()
  }, [roomCode, playerId])

  const fetchPlayerInfo = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/get_player_info?roomCode=${roomCode}&playerId=${playerId}`))
      const data = await res.json()
      if (res.ok) {
        setRole(data.role)
        setWord(data.word)
        setCategory(data.category)
        setIsLoading(false)
      } else {
        alert('Failed to load player info: ' + (data.detail || data.error))
        setIsLoading(false)
      }
    } catch (error) {
      alert('Error loading player info')
      setIsLoading(false)
    }
  }

  const handleWebSocketMessage = (message) => {
    if (message.type === 'player_info' && message.playerId === playerId) {
      setRole(message.data.role)
      setWord(message.data.word)
      setCategory(message.data.category)
      setIsLoading(false)
    } else if (message.type === 'room_update') {
      if (message.data.status === 'voting') {
        navigate(`/voting?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId || ''}`)
      }
    }
  }

  useWebSocket(roomCode, handleWebSocketMessage)

  const handleOK = async () => {
    if (!roomCode || !playerId) return

    setIsMarkingRevealed(true)
    try {
      const res = await fetch(getApiUrl('/api/mark_revealed'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerId,
        }),
      })

      const data = await res.json()
      // Automatically navigate to voting page after marking as revealed
      navigate(`/voting?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId || ''}&role=${encodeURIComponent(role || '')}&word=${encodeURIComponent(word || '')}&category=${encodeURIComponent(category || '')}`)
    } catch (error) {
      console.error('Error marking revealed:', error)
      setIsMarkingRevealed(false)
    }
  }


  if (isLoading) {
    return (
      <div className="container">
        <div className="waiting-message">Loading your role...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="reveal-screen">
        {role === 'crew' && (
          <>
            <h2>✨ Your Word</h2>
            <div className="word-display">{word}</div>
            <div className="category-display">📂 {category}</div>
            <p style={{ marginTop: '24px', color: '#6b7280', fontSize: '1rem' }}>
              Remember this word! You'll need to give clues without saying it.
            </p>
          </>
        )}

        {role === 'imposter' && (
          <>
            <h2>You are the</h2>
            <div className="imposter-display">🎭 IMPOSTER</div>
            <div className="imposter-gif-container">
              <img 
                src="/imposter.gif" 
                alt="Imposter" 
                className="imposter-gif"
              />
            </div>
            <div className="category-display">📂 {category}</div>
            <p style={{ 
              marginTop: '32px', 
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: '500',
              padding: '16px 24px',
              background: 'var(--md-surface-variant)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}>
              ⚠️ You do NOT know the secret word. Try to blend in!
            </p>
          </>
        )}

        <button
          onClick={handleOK}
          disabled={isMarkingRevealed}
          className="button"
          style={{ marginTop: '48px' }}
        >
          {isMarkingRevealed ? (
            <>
              <span className="loading"></span>
              Confirming...
            </>
          ) : (
            '✓ Got it!'
          )}
        </button>

      </div>
    </div>
  )
}

