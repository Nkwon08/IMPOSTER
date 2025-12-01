// Game state management

export interface Player {
  id: string;
  name: string;
  role?: 'crew' | 'imposter';
  word?: string | null;
  hasRevealed?: boolean;
  vote?: string; // playerId they voted for
}

export interface Room {
  roomCode: string;
  hostId: string;
  players: Player[];
  status: 'waiting' | 'reveal' | 'voting' | 'results';
  category?: string;
  numImposters?: number;
  secretWord?: string;
  votes: Record<string, string>; // playerId -> votedFor playerId
  eliminatedPlayerId?: string;
  gameResult?: 'crew_win' | 'imposter_win';
}

const rooms: Map<string, Room> = new Map();

// Word lists by category
export const WORD_LISTS: Record<string, string[]> = {
  Animals: ['Elephant', 'Giraffe', 'Penguin', 'Dolphin', 'Tiger', 'Lion', 'Bear', 'Monkey', 'Zebra', 'Kangaroo'],
  Foods: ['Pizza', 'Burger', 'Sushi', 'Taco', 'Pasta', 'Ice Cream', 'Sandwich', 'Salad', 'Soup', 'Steak'],
  Celebrities: ['Taylor Swift', 'Tom Hanks', 'Beyonce', 'Leonardo DiCaprio', 'Oprah', 'Dwayne Johnson', 'Emma Watson', 'Chris Evans', 'Ariana Grande', 'Ryan Reynolds'],
  Countries: ['Japan', 'France', 'Brazil', 'Canada', 'Australia', 'Italy', 'Spain', 'Germany', 'India', 'Mexico'],
  'TV Shows': ['Friends', 'Game of Thrones', 'Breaking Bad', 'The Office', 'Stranger Things', 'The Crown', 'The Simpsons', 'The Walking Dead', 'Lost', 'House of Cards'],
};

export function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function createRoom(hostId: string): Room {
  const roomCode = generateRoomCode();
  const room: Room = {
    roomCode,
    hostId,
    players: [{ id: hostId, name: 'Host' }],
    status: 'waiting',
    votes: {},
  };
  rooms.set(roomCode, room);
  return room;
}

export function getRoom(roomCode: string): Room | undefined {
  return rooms.get(roomCode);
}

export function joinRoom(roomCode: string, playerId: string, playerName: string): Room | null {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'waiting') {
    return null;
  }
  
  // Check if player already exists
  const existingPlayer = room.players.find(p => p.id === playerId);
  if (!existingPlayer) {
    room.players.push({ id: playerId, name: playerName });
  } else {
    existingPlayer.name = playerName;
  }
  
  return room;
}

export function startGame(roomCode: string, category: string, numImposters: number): Room | null {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'waiting' || room.players.length < 3) {
    return null;
  }

  const words = WORD_LISTS[category];
  if (!words || words.length === 0) {
    return null;
  }

  // Pick random word
  const secretWord = words[Math.floor(Math.random() * words.length)];

  // Shuffle players and assign roles
  const shuffled = [...room.players].sort(() => Math.random() - 0.5);
  const imposters = shuffled.slice(0, numImposters);
  const crew = shuffled.slice(numImposters);

  // Assign roles
  room.players.forEach(player => {
    const isImposter = imposters.some(imp => imp.id === player.id);
    if (isImposter) {
      player.role = 'imposter';
      player.word = null;
    } else {
      player.role = 'crew';
      player.word = secretWord;
    }
    player.hasRevealed = false;
  });

  room.category = category;
  room.numImposters = numImposters;
  room.secretWord = secretWord;
  room.status = 'reveal';
  room.votes = {};

  return room;
}

export function markRevealed(roomCode: string, playerId: string): Room | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.hasRevealed = true;
  }

  // Check if all players have revealed
  const allRevealed = room.players.every(p => p.hasRevealed);
  if (allRevealed && room.status === 'reveal') {
    // Don't auto-advance, wait for host to start voting
  }

  return room;
}

export function startVoting(roomCode: string): Room | null {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'reveal') return null;

  room.status = 'voting';
  room.votes = {};
  return room;
}

export function submitVote(roomCode: string, playerId: string, votedForId: string): Room | null {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'voting') return null;

  room.votes[playerId] = votedForId;

  // Check if all players have voted
  const allVoted = room.players.every(p => room.votes[p.id]);
  if (allVoted) {
    // Calculate results
    const voteCounts: Record<string, number> = {};
    room.players.forEach(p => {
      voteCounts[p.id] = 0;
    });

    Object.values(room.votes).forEach(votedForId => {
      voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
    });

    // Find player with most votes
    let maxVotes = 0;
    let eliminatedId = '';
    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = id;
      }
    });

    room.eliminatedPlayerId = eliminatedId;
    const eliminatedPlayer = room.players.find(p => p.id === eliminatedId);
    
    if (eliminatedPlayer?.role === 'imposter') {
      room.gameResult = 'crew_win';
    } else {
      room.gameResult = 'imposter_win';
    }

    room.status = 'results';
  }

  return room;
}

export function getPlayerInfo(room: Room, playerId: string) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  return {
    role: player.role,
    word: player.word,
    category: room.category,
  };
}

