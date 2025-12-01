import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Results() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('roomCode')
  const playerId = searchParams.get('playerId')

  const [roomState, setRoomState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!roomCode) return
    fetchResults()
  }, [roomCode])

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/get_room_state?roomCode=${roomCode}`)
      const data = await res.json()
      if (res.ok) {
        setRoomState(data)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      setIsLoading(false)
    }
  }

  if (isLoading || !roomState) {
    return (
      <div className="container">
        <div className="waiting-message">Loading results...</div>
      </div>
    )
  }

  const eliminatedPlayer = roomState.players.find(
    (p) => p.id === roomState.eliminatedPlayerId
  )
  const isWin = roomState.gameResult === 'crew_win'
  const numImposters = roomState.numImposters || 1

  return (
    <div className={`container results-screen ${isWin ? 'win' : 'lose'}`}>
      <div style={{ fontSize: '5rem', marginBottom: '24px', animation: 'pulse 2s ease-in-out infinite' }}>
        {isWin ? '🎉' : '💀'}
      </div>
      <h2 className="results-title">
        {isWin ? 'You Got the Imposter!' : 'Game Over'}
      </h2>

      {eliminatedPlayer && (
        <div className="results-message" style={{ 
          padding: '16px 24px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          marginBottom: '16px'
        }}>
          <strong>{eliminatedPlayer.name}</strong> was eliminated
        </div>
      )}

      {isWin ? (
        <div className="results-message">
          {numImposters > 1
            ? `🎯 You caught 1 of ${numImposters} imposters!`
            : '🎯 You caught the imposter!'}
        </div>
      ) : (
        <div className="results-message">
          <strong>{eliminatedPlayer?.name}</strong> is NOT the imposter.
          <br />
          <span style={{ fontSize: '1.2em', marginTop: '8px', display: 'block' }}>
            🎭 Imposters win!
          </span>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="button"
        style={{
          marginTop: '48px',
          background: 'rgba(255, 255, 255, 0.25)',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        🎮 Play Again
      </button>
    </div>
  )
}

