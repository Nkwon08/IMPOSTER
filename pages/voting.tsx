import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Player {
  id: string;
  name: string;
}

export default function Voting() {
  const router = useRouter();
  const { roomCode, playerId, playerName, hostId } = router.query;
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!roomCode || typeof roomCode !== 'string') return;

    // Poll for room state
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/get_room_state?roomCode=${roomCode}`);
        const data = await res.json();
        if (res.ok) {
          // Filter out current player from list
          const otherPlayers = (data.players || []).filter(
            (p: Player) => p.id !== playerId
          );
          setPlayers(otherPlayers);

          // Check if voting is complete
          if (data.status === 'results') {
            router.push({
              pathname: '/results',
              query: {
                roomCode,
                playerId,
                playerName,
                hostId,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error polling room state:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [roomCode, playerId, router]);

  const handleVote = async () => {
    if (!selectedPlayerId || !roomCode || !playerId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submit_vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerId,
          votedForId: selectedPlayerId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setHasVoted(true);
        if (data.allVoted) {
          // All votes in, redirect to results
          router.push({
            pathname: '/results',
            query: {
              roomCode,
              playerId,
              playerName,
              hostId,
            },
          });
        }
      } else {
        alert('Failed to submit vote: ' + data.error);
        setIsSubmitting(false);
      }
    } catch (error) {
      alert('Error submitting vote');
      setIsSubmitting(false);
    }
  };

  if (!roomCode || typeof roomCode !== 'string') {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h2>Voting</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Choose who you think is the imposter
      </p>

      {!hasVoted ? (
        <>
          <ul className="player-list">
            {players.map((player) => (
              <li
                key={player.id}
                className={`player-item voteable ${
                  selectedPlayerId === player.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedPlayerId(player.id)}
              >
                {player.name}
              </li>
            ))}
          </ul>

          <button
            onClick={handleVote}
            disabled={!selectedPlayerId || isSubmitting}
            className="button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Vote'}
          </button>
        </>
      ) : (
        <div className="waiting-message">
          Waiting for other players to vote...
        </div>
      )}
    </div>
  );
}

