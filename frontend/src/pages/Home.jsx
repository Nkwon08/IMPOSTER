import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getApiUrl } from '../utils/config'

export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    const urlRoomCode = searchParams.get('roomCode')
    if (urlRoomCode) {
      setRoomCode(urlRoomCode)
    }
  }, [searchParams])

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name')
      return
    }

    setIsCreating(true)
    try {
      const apiUrl = getApiUrl('/api/create_room')
      console.log('Creating game with API URL:', apiUrl)
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('API Error Response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { detail: errorText }
        }
        alert('Failed to create game: ' + (errorData.detail || errorData.error || errorText))
        return
      }

      const data = await res.json()
      navigate(`/lobby?roomCode=${data.roomCode}&hostId=${data.hostId}&playerName=${encodeURIComponent(playerName)}&playerId=${data.hostId}`)
    } catch (error) {
      console.error('Error creating game:', error)
      const apiUrl = getApiUrl('/api/create_room')
      console.error('API URL attempted:', apiUrl)
      console.error('VITE_API_URL env var:', import.meta.env.VITE_API_URL)
      alert(`Error creating game: ${error.message}\n\nCheck:\n1. Backend is running\n2. VITE_API_URL is set correctly\n3. Backend URL is accessible\n\nSee console for details.`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinGame = async () => {
    if (!roomCode.trim() || !playerName.trim()) {
      alert('Please enter room code and your name')
      return
    }

    setIsJoining(true)
    try {
      const res = await fetch(getApiUrl('/api/join_room'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.trim(),
          playerName: playerName.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        navigate(`/lobby?roomCode=${data.roomCode}&playerId=${data.playerId}&playerName=${encodeURIComponent(playerName)}&isHost=false`)
      } else {
        alert('Failed to join game: ' + (data.detail || data.error))
      }
    } catch (error) {
      alert('Error joining game')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="container">
      <h1>IMPOSTER</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.1rem', fontWeight: '400' }}>
      </p>

      <div>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="input"
          maxLength={20}
        />
      </div>

      <div style={{ marginTop: '24px' }}>
        <button
          onClick={handleCreateGame}
          disabled={isCreating || isJoining}
          className="button important"
        >
          {isCreating ? (
            <>
              <span className="loading"></span>
              Creating...
            </>
          ) : (
            '🚀 Create Game'
          )}
        </button>
      </div>

      <div className="divider">OR</div>

      <div>
        <input
          type="text"
          placeholder="Enter room code (4 digits)"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="input"
          maxLength={4}
          style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px', fontWeight: '600' }}
        />
        <button
          onClick={handleJoinGame}
          disabled={isCreating || isJoining}
          className="button important"
        >
          {isJoining ? (
            <>
              <span className="loading"></span>
              Joining...
            </>
          ) : (
            '🎮 Join Game'
          )}
        </button>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          onClick={() => setShowRules(true)}
          className="button"
          style={{
            background: 'var(--md-surface-variant)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-secondary)',
            boxShadow: 'none',
            fontSize: '0.9rem',
            padding: '12px 24px',
          }}
        >
          📖 Rules
        </button>
      </div>

      {showRules && (
        <div className="rules-modal" onClick={() => setShowRules(false)}>
          <div className="rules-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="rules-close"
              onClick={() => setShowRules(false)}
            >
              ✕
            </button>
            <h2 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>🎮 Game Rules</h2>
            
            <div className="rules-section">
              <h3>Objective</h3>
              <p>Crew members try to identify the imposter(s) who don't know the secret word.</p>
            </div>

            <div className="rules-section">
              <h3>Setup</h3>
              <ol>
                <li>Host creates a game room and shares the room code</li>
                <li>Players join the room</li>
                <li>Host selects a category and number of imposters</li>
                <li>Game begins - each player sees their role</li>
              </ol>
            </div>

            <div className="rules-section">
              <h3>Roles</h3>
              <p><strong>Crew:</strong> Knows the secret word. Must give clues without saying the word directly.</p>
              <p><strong>Imposter:</strong> Does NOT know the secret word. Must blend in and avoid suspicion.</p>
            </div>

            <div className="rules-section">
              <h3>Gameplay</h3>
              <ol>
                <li><strong>Reveal Phase:</strong> Each player sees their role and word</li>
                <li><strong>Clue Phase:</strong> Players give one-word clues verbally</li>
                <li><strong>Voting Phase:</strong> Players vote on who they think is the imposter</li>
                <li><strong>Results:</strong> If the eliminated player is an imposter, crew wins! Otherwise, imposters win.</li>
              </ol>
            </div>

            <div className="rules-section">
              <h3>Tips</h3>
              <ul>
                <li>Crew: Give clues related to the word without saying it</li>
                <li>Imposter: Listen carefully and try to blend in with your clues</li>
                <li>Pay attention to who seems unsure or gives vague clues</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

