import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'

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
      const res = await fetch(`/api/get_player_info?roomCode=${roomCode}&playerId=${playerId}`)
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
      const res = await fetch('/api/mark_revealed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerId,
        }),
      })

      const data = await res.json()
      // WebSocket will handle status updates
    } catch (error) {
      console.error('Error marking revealed:', error)
    } finally {
      setIsMarkingRevealed(false)
    }
  }

  const handleStartVoting = async () => {
    if (!roomCode || !hostId) return

    try {
      const res = await fetch('/api/start_voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          hostId,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        navigate(`/voting?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId}`)
      } else {
        alert('Failed to start voting: ' + (data.detail || data.error))
      }
    } catch (error) {
      alert('Error starting voting')
    }
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="waiting-message">Loading your role...</div>
      </div>
    )
  }

  const isHostUser = hostId === playerId

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
            <div className="category-display">📂 {category}</div>
            <p style={{ 
              marginTop: '32px', 
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: '500'
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

        {isHostUser && (
          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '2px solid rgba(139, 92, 246, 0.3)' }}>
            <p className="waiting-message">
              Once all players have confirmed, you can start voting.
            </p>
            <button onClick={handleStartVoting} className="button" style={{ marginTop: '16px' }}>
              🗳️ Start Voting
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

