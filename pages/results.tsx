import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface RoomState {
  eliminatedPlayerId?: string;
  gameResult?: 'crew_win' | 'imposter_win';
  players: Array<{ id: string; name: string }>;
  numImposters?: number;
}

export default function Results() {
  const router = useRouter();
  const { roomCode, playerId } = router.query;
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomCode || typeof roomCode !== 'string') return;

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/get_room_state?roomCode=${roomCode}`);
        const data = await res.json();
        if (res.ok) {
          setRoomState(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [roomCode]);

  if (isLoading || !roomState) {
    return (
      <div className="container">
        <div className="waiting-message">Loading results...</div>
      </div>
    );
  }

  const eliminatedPlayer = roomState.players.find(
    (p) => p.id === roomState.eliminatedPlayerId
  );
  const isWin = roomState.gameResult === 'crew_win';
  const numImposters = roomState.numImposters || 1;

  return (
    <div className={`container results-screen ${isWin ? 'win' : 'lose'}`}>
      <h2 className="results-title">
        {isWin ? '🎉 You Got the Imposter!' : '❌ Game Over'}
      </h2>

      {eliminatedPlayer && (
        <div className="results-message">
          {eliminatedPlayer.name} was eliminated
        </div>
      )}

      {isWin ? (
        <div className="results-message">
          {numImposters > 1
            ? `You caught 1 of ${numImposters} imposters!`
            : 'You caught the imposter!'}
        </div>
      ) : (
        <div className="results-message">
          {eliminatedPlayer?.name} is NOT the imposter.
          <br />
          Imposters win!
        </div>
      )}

      <button
        onClick={() => router.push('/')}
        className="button"
        style={{
          marginTop: '40px',
          background: 'rgba(255, 255, 255, 0.3)',
          border: '2px solid white',
        }}
      >
        Play Again
      </button>
    </div>
  );
}

