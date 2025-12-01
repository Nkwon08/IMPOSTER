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

  // Get role/word from URL params (passed from Reveal page) or fetch from API
  const [role, setRole] = useState(searchParams.get('role') || null)
  const [word, setWord] = useState(searchParams.get('word') || null)
  const [category, setCategory] = useState(searchParams.get('category') || null)

  const [players, setPlayers] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!roomCode) return
    fetchRoomState()
    // If role/word not in URL params, fetch from API
    if (!role && playerId) {
      fetchPlayerInfo()
    }
  }, [roomCode, playerId])

  const fetchPlayerInfo = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/get_player_info?roomCode=${roomCode}&playerId=${playerId}`))
      const data = await res.json()
      if (res.ok) {
        setRole(data.role)
        setWord(data.word)
        setCategory(data.category)
      }
    } catch (error) {
      console.error('Error fetching player info:', error)
    }
  }

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
      // Automatically navigate to results when status changes to 'results'
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
        // If all votes are in, navigate immediately (WebSocket will also trigger this)
        if (data.allVoted || data.status === 'results') {
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
      {/* Reminder badge in corner */}
      {role && (
        <div className="voting-reminder">
          {role === 'crew' ? (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Your Word</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--md-primary)' }}>{word}</div>
              {category && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-hint)', marginTop: '4px' }}>📂 {category}</div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Your Role</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--md-error)' }}>🎭 IMPOSTER</div>
              {category && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-hint)', marginTop: '4px' }}>📂 {category}</div>
              )}
            </>
          )}
        </div>
      )}

      <h2>🗳️ Voting</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px', fontSize: '1.1rem', fontWeight: '500' }}>
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

