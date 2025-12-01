import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import { getApiUrl } from '../utils/config'

export default function Voting() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('roomCode')
  const playerId = searchParams.get('playerId')
  const playerName = searchParams.get('playerName')
  const hostId = searchParams.get('hostId')

  const [players, setPlayers] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!roomCode) return
    fetchRoomState()
  }, [roomCode, playerId])

  const fetchRoomState = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/get_room_state?roomCode=${roomCode}`))
      const data = await res.json()
      if (res.ok) {
        const otherPlayers = (data.players || []).filter((p) => p.id !== playerId)
        setPlayers(otherPlayers)
        if (data.status === 'results') {
          navigate(`/results?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId || ''}`)
        }
      }
    } catch (error) {
      console.error('Error fetching room state:', error)
    }
  }

  const handleWebSocketMessage = (message) => {
    if (message.type === 'room_update') {
      const otherPlayers = (message.data.players || []).filter((p) => p.id !== playerId)
      setPlayers(otherPlayers)
      if (message.data.status === 'results') {
        navigate(`/results?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId || ''}`)
      }
    }
  }

  useWebSocket(roomCode, handleWebSocketMessage)

  const handleVote = async () => {
    if (!selectedPlayerId || !roomCode || !playerId) return

    setIsSubmitting(true)
    try {
      const res = await fetch(getApiUrl('/api/submit_vote'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerId,
          votedForId: selectedPlayerId,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setHasVoted(true)
        if (data.allVoted) {
          navigate(`/results?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId || ''}`)
        }
      } else {
        alert('Failed to submit vote: ' + (data.detail || data.error))
        setIsSubmitting(false)
      }
    } catch (error) {
      alert('Error submitting vote')
      setIsSubmitting(false)
    }
  }

  if (!roomCode) {
    return <div className="container">Loading...</div>
  }

  return (
    <div className="container">
      <h2>🗳️ Voting</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px', fontSize: '1.1rem', fontWeight: '500' }}>
        Choose who you think is the imposter
      </p>

      {!hasVoted ? (
        <>
          <ul className="player-list">
            {players.map((player, index) => (
              <li
                key={player.id}
                className={`player-item voteable ${
                  selectedPlayerId === player.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedPlayerId(player.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span style={{ marginRight: '12px', fontSize: '1.5rem' }}>
                  {selectedPlayerId === player.id ? '✓' : '👤'}
                </span>
                {player.name}
              </li>
            ))}
          </ul>

          <button
            onClick={handleVote}
            disabled={!selectedPlayerId || isSubmitting}
            className="button"
            style={{ marginTop: '24px' }}
          >
            {isSubmitting ? (
              <>
                <span className="loading"></span>
                Submitting...
              </>
            ) : (
              '✓ Submit Vote'
            )}
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="waiting-message">
            Waiting for other players to vote...
          </div>
          <div style={{ 
            marginTop: '24px', 
            fontSize: '3rem',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            ⏳
          </div>
        </div>
      )}
    </div>
  )
}

