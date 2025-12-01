import type { NextApiRequest, NextApiResponse } from 'next';
import { getRoom, startVoting } from '@/lib/gameState';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomCode, hostId } = req.body;

  if (!roomCode || !hostId) {
    return res.status(400).json({ error: 'Missing roomCode or hostId' });
  }

  const room = getRoom(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.hostId !== hostId) {
    return res.status(403).json({ error: 'Only host can start voting' });
  }

  const updatedRoom = startVoting(roomCode);
  if (!updatedRoom) {
    return res.status(400).json({ error: 'Failed to start voting' });
  }

  res.status(200).json({
    success: true,
    status: updatedRoom.status,
  });
}

