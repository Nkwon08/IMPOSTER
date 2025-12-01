import type { NextApiRequest, NextApiResponse } from 'next';
import { getRoom, joinRoom } from '@/lib/gameState';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomCode, playerName } = req.body;

  if (!roomCode || !playerName) {
    return res.status(400).json({ error: 'Missing roomCode or playerName' });
  }

  const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const room = joinRoom(roomCode, playerId, playerName);

  if (!room) {
    return res.status(404).json({ error: 'Room not found or game already started' });
  }

  res.status(200).json({
    playerId,
    roomCode: room.roomCode,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    status: room.status,
  });
}

