import type { NextApiRequest, NextApiResponse } from 'next';
import { getRoom } from '@/lib/gameState';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomCode } = req.query;

  if (!roomCode || typeof roomCode !== 'string') {
    return res.status(400).json({ error: 'Missing roomCode' });
  }

  const room = getRoom(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Return public room state (no secret info)
  res.status(200).json({
    roomCode: room.roomCode,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    status: room.status,
    category: room.category,
    numImposters: room.numImposters,
    eliminatedPlayerId: room.eliminatedPlayerId,
    gameResult: room.gameResult,
  });
}

