import type { NextApiRequest, NextApiResponse } from 'next';
import { getRoom, getPlayerInfo } from '@/lib/gameState';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomCode, playerId } = req.query;

  if (!roomCode || !playerId || typeof roomCode !== 'string' || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'Missing roomCode or playerId' });
  }

  const room = getRoom(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const playerInfo = getPlayerInfo(room, playerId);
  if (!playerInfo) {
    return res.status(404).json({ error: 'Player not found' });
  }

  res.status(200).json(playerInfo);
}

