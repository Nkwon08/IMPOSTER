import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Player {
  id: string;
  name: string;
}

const CATEGORIES = ['Animals', 'Foods', 'Celebrities', 'Countries', 'TV Shows'];
const IMPOSTER_COUNTS = [1, 2, 3];

export default function Lobby() {
  const router = useRouter();
  const { roomCode, hostId, playerId, playerName, isHost } = router.query;
  const [players, setPlayers] = useState<Player[]>([]);
  const [category, setCategory] = useState('Animals');
  const [numImposters, setNumImposters] = useState(1);
  const [isStarting, setIsStarting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const isHostUser = isHost !== 'false' && hostId === playerId;

  useEffect(() => {
    if (!roomCode || typeof roomCode !== 'string') return;

    // Set invite link
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setInviteLink(`${baseUrl}/join/${roomCode}`);

    // Poll for room state
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/get_room_state?roomCode=${roomCode}`);
        const data = await res.json();
        if (res.ok) {
          setPlayers(data.players || []);

          // If game started, redirect to reveal screen
          if (data.status === 'reveal') {
            router.push({
              pathname: '/reveal',
              query: {
                roomCode,
                playerId,
                playerName,
                hostId: isHostUser ? hostId : undefined,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error polling room state:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [roomCode, playerId, playerName, hostId, isHostUser, router]);

  const handleStartGame = async () => {
    if (!isHostUser) return;
    if (players.length < 3) {
      alert('Need at least 3 players to start');
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch('/api/start_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          category,
          numImposters,
          hostId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push({
          pathname: '/reveal',
          query: {
            roomCode,
            playerId,
            playerName,
            hostId,
          },
        });
      } else {
        alert('Failed to start game: ' + data.error);
        setIsStarting(false);
      }
    } catch (error) {
      alert('Error starting game');
      setIsStarting(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied!');
  };

  if (!roomCode || typeof roomCode !== 'string') {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h2>Game Lobby</h2>
      <div className="room-code">{roomCode}</div>

      <div className="invite-link">
        <div style={{ marginBottom: '10px', fontWeight: '600' }}>Invite Link:</div>
        <div style={{ wordBreak: 'break-all', marginBottom: '10px' }}>{inviteLink}</div>
        <button onClick={handleCopyInviteLink} className="button copy-button">
          Copy Invite Link
        </button>
      </div>

      <div>
        <h3>Players ({players.length})</h3>
        <ul className="player-list">
          {players.map((player) => (
            <li key={player.id} className="player-item">
              {player.name} {player.id === hostId ? '(Host)' : ''}
            </li>
          ))}
        </ul>
      </div>

      {isHostUser && (
        <div className="host-controls">
          <h3>Game Settings</h3>
          <label className="label">Category</label>
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

          <label className="label">Number of Imposters</label>
          <select
            value={numImposters}
            onChange={(e) => setNumImposters(Number(e.target.value))}
            className="select"
          >
            {IMPOSTER_COUNTS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>

          <button
            onClick={handleStartGame}
            disabled={isStarting || players.length < 3}
            className="button"
            style={{ marginTop: '20px' }}
          >
            {isStarting ? 'Starting...' : 'Start Game'}
          </button>
        </div>
      )}

      {!isHostUser && (
        <div className="waiting-message">
          Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}

