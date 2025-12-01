# 🎭 Imposter Game

A word guessing game with hidden imposters, similar to Among Us or Mafia. Players try to identify the imposter(s) who don't know the secret word.

## Tech Stack

- **Frontend**: React + JavaScript (Vite)
- **Backend**: FastAPI (Python)
- **Real-time**: WebSockets
- **Database**: In-memory (MongoDB optional)

## Features

- **Create/Join Rooms**: Host creates a game room with a unique 4-digit code
- **Lobby System**: Players join and wait in the lobby
- **Host Controls**: Host selects category and number of imposters
- **Role Assignment**: Backend randomly assigns crew (know word) or imposter (doesn't know word) roles
- **Reveal Screen**: Each player sees only their own role and word
- **Voting System**: Players vote on who they think is the imposter
- **Results Screen**: Shows whether the crew caught the imposter or not
- **Real-time Updates**: WebSocket connections for instant updates

## Privacy & Security

- Each player only receives their own role and word from the backend
- Full game state is never sent to clients
- Players cannot see other players' roles through network inspection
- All game logic is handled server-side

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## How to Play

1. **Create Game**: Host enters their name and clicks "Create Game"
2. **Share Room Code**: Host shares the 4-digit room code or invite link
3. **Join Game**: Players enter the room code and their name
4. **Lobby**: Host selects category and number of imposters, then starts the game
5. **Reveal**: Each player sees their role (crew sees word, imposter sees "IMPOSTER")
6. **Clue Phase**: Players give one-word clues verbally (on FaceTime/Zoom/Discord)
7. **Voting**: Host starts voting, players vote on who they think is the imposter
8. **Results**: See if the crew caught the imposter!

## Game Flow

```
Home → Lobby → Reveal → Voting → Results
```

## API Endpoints

- `POST /api/create_room` - Create a new game room
- `POST /api/join_room` - Join an existing room
- `GET /api/get_room_state` - Get public room state (no secrets)
- `GET /api/get_player_info` - Get player's own role and word
- `POST /api/start_game` - Start the game (host only)
- `POST /api/mark_revealed` - Mark that player has seen reveal screen
- `POST /api/start_voting` - Start voting phase (host only)
- `POST /api/submit_vote` - Submit a vote
- `WebSocket /ws/{roomCode}` - Real-time updates

## Categories

- Animals
- Foods
- Celebrities
- Countries
- TV Shows

## Project Structure

```
IMPOSTER_GAME/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── hooks/          # Custom hooks (useWebSocket)
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Notes

- Game state is stored in memory (will reset on server restart)
- For production, consider using MongoDB or Redis for persistent storage
- WebSocket connections automatically reconnect on disconnect
- CORS is configured for local development

## Optional: MongoDB Integration

To add MongoDB persistence, uncomment and configure MongoDB in `backend/main.py`:

```python
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.imposter_game
rooms_collection = db.rooms
```

Then modify the Room class to save/load from MongoDB instead of in-memory storage.
