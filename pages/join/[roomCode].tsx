import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function JoinRoom() {
  const router = useRouter();
  const { roomCode } = router.query;

  useEffect(() => {
    if (roomCode && typeof roomCode === 'string') {
      // Redirect to home with room code pre-filled
      router.push({
        pathname: '/',
        query: { roomCode },
      });
    }
  }, [roomCode, router]);

  return (
    <div className="container">
      <div className="waiting-message">Redirecting...</div>
    </div>
  );
}

