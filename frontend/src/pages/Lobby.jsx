import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import { getApiUrl } from '../utils/config'

const CATEGORIES = ['Animals', 'Foods', 'Celebrities', 'Countries', 'TV Shows', 'Locations', 'Objects']
const IMPOSTER_COUNTS = [1, 2, 3]

export default function Lobby() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('roomCode')
  const hostId = searchParams.get('hostId')
  const playerId = searchParams.get('playerId')
  const playerName = searchParams.get('playerName')
  const isHost = searchParams.get('isHost') !== 'false' && hostId === playerId

  const [players, setPlayers] = useState([])
  const [category, setCategory] = useState('Animals')
  const [numImposters, setNumImposters] = useState(1)
  const [isStarting, setIsStarting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    if (!roomCode) return

    const baseUrl = window.location.origin
    setInviteLink(`${baseUrl}/?roomCode=${roomCode}`)

    // Fetch initial room state
    fetchRoomState()
  }, [roomCode])

  const fetchRoomState = async () => {
    if (!roomCode) return
    try {
      const res = await fetch(getApiUrl(`/api/get_room_state?roomCode=${roomCode}`))
      const data = await res.json()
      if (res.ok) {
        setPlayers(data.players || [])
        if (data.status === 'reveal') {
          navigate(`/reveal?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId || ''}`)
        }
      }
    } catch (error) {
      console.error('Error fetching room state:', error)
    }
  }

  const handleWebSocketMessage = (message) => {
    if (message.type === 'room_update') {
      setPlayers(message.data.players || [])
      if (message.data.status === 'reveal') {
        navigate(`/reveal?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId || ''}`)
      }
    }
  }

  useWebSocket(roomCode, handleWebSocketMessage)

  const handleStartGame = async () => {
    if (!isHost) return
    if (players.length < 3) {
      alert('Need at least 3 players to start')
      return
    }

    setIsStarting(true)
    try {
      const res = await fetch(getApiUrl('/api/start_game'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          category,
          numImposters,
          hostId,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        navigate(`/reveal?roomCode=${roomCode}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&hostId=${hostId}`)
      } else {
        alert('Failed to start game: ' + (data.detail || data.error))
        setIsStarting(false)
      }
    } catch (error) {
      alert('Error starting game')
      setIsStarting(false)
    }
  }

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    alert('Invite link copied!')
  }

  if (!roomCode) {
    return <div className="container">Loading...</div>
  }

  return (
    <div className="container">
      <h2>🎮 Game Lobby</h2>
      <div className="room-code">{roomCode}</div>

      <div className="invite-link">
        <div className="invite-link-label">🔗 Invite Link</div>
        <div className="invite-link-url">{inviteLink}</div>
        <button onClick={handleCopyInviteLink} className="button copy-button">
          📋 Copy Invite Link
        </button>
      </div>

      <div>
        <h3>👥 Players ({players.length})</h3>
        <ul className="player-list">
          {players.map((player) => (
            <li key={player.id} className="player-item">
              {player.name}
              {player.id === hostId && <span className="host-badge">Host</span>}
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <div className="host-controls">
          <h3>⚙️ Game Settings</h3>
          <label className="label">📂 Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <label className="label">🎭 Number of Imposters</label>
          <select
            value={numImposters}
            onChange={(e) => setNumImposters(Number(e.target.value))}
            className="select"
          >
            {IMPOSTER_COUNTS.map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'Imposter' : 'Imposters'}
              </option>
            ))}
          </select>

          <button
            onClick={handleStartGame}
            disabled={isStarting || players.length < 3}
            className="button"
            style={{ marginTop: '24px' }}
          >
            {isStarting ? (
              <>
                <span className="loading"></span>
                Starting...
              </>
            ) : (
              '🚀 Start Game'
            )}
          </button>
          {players.length < 3 && (
            <p style={{ marginTop: '12px', color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
              ⚠️ Need at least 3 players to start
            </p>
          )}
        </div>
      )}

      {!isHost && (
        <div className="waiting-message">
          Waiting for host to start the game...
        </div>
      )}
    </div>
  )
}

