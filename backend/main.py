from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import random
import asyncio
from datetime import datetime

app = FastAPI()

# CORS middleware
import os

# Get allowed origins from environment variable or use defaults
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# Add frontend URL from environment variable if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    # Remove trailing slash if present
    frontend_url = frontend_url.rstrip('/')
    allowed_origins.append(frontend_url)
    print(f"CORS: Added frontend URL: {frontend_url}")

# Log allowed origins for debugging
print(f"CORS: Allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint - confirms API is running"""
    return {
        "message": "Imposter Game API is running!",
        "docs": "/docs",
        "status": "ok"
    }

# Word lists by category
WORD_LISTS = {
    "Animals": [
        "Elephant", "Giraffe", "Penguin", "Dolphin", "Tiger",
        "Lion", "Bear", "Monkey", "Zebra", "Kangaroo",
        "Panda", "Cheetah", "Hippo", "Rhinoceros", "Fox",
        "Wolf", "Eagle", "Shark", "Octopus", "Koala"
    ],

    "Foods": [
        "Pizza", "Burger", "Sushi", "Taco", "Pasta",
        "Ice Cream", "Sandwich", "Salad", "Soup", "Steak",
        "Ramen", "Fried Chicken", "Doughnut", "Bagel", "Nachos",
        "Hot Dog", "Burrito", "Curry", "Pancakes", "Smoothie"
    ],

    "Celebrities": [
        "Taylor Swift", "Tom Hanks", "Beyonce", "Leonardo DiCaprio", "Oprah",
        "Dwayne Johnson", "Emma Watson", "Chris Evans", "Ariana Grande", "Ryan Reynolds",
        "Selena Gomez", "Will Smith", "Zendaya", "Morgan Freeman", "Kim Kardashian",
        "Bruno Mars", "Billie Eilish", "Keanu Reeves", "Jennifer Lawrence", "Drake"
    ],

    "Countries": [
        "Japan", "France", "Brazil", "Canada", "Australia",
        "Italy", "Spain", "Germany", "India", "Mexico",
        "China", "South Korea", "United Kingdom", "Egypt", "Argentina",
        "South Africa", "Russia", "Thailand", "Sweden", "Turkey"
    ],

    "TV Shows": [
        "Friends", "Game of Thrones", "Breaking Bad", "The Office", "Stranger Things",
        "The Crown", "The Simpsons", "The Walking Dead", "Lost", "House of Cards",
        "Parks and Recreation", "How I Met Your Mother", "Westworld", "Sherlock", "The Mandalorian",
        "Brooklyn Nine-Nine", "Better Call Saul", "Rick and Morty", "Grey's Anatomy", "Narcos"
    ],

    "Locations": [
        "Beach", "Mountain", "Hospital", "Airport", "School",
        "Library", "Restaurant", "Mall", "Park", "Hotel",
        "Train Station", "Zoo", "Museum", "Stadium", "Farm",
        "Bridge", "Castle", "Forest", "Aquarium", "Cinema"
    ],

    "Objects": [
        "Chair", "Laptop", "Phone", "Backpack", "Bottle",
        "Clock", "Pillow", "Scissors", "Umbrella", "Flashlight",
        "Glasses", "Wallet", "Keys", "Headphones", "Pen",
        "Remote", "Mirror", "Shoes", "Blanket", "Candle"
    ]
}

# Game state storage
rooms: Dict[str, "Room"] = {}
active_connections: Dict[str, List[WebSocket]] = {}  # roomCode -> list of websockets


class Player(BaseModel):
    id: str
    name: str
    role: Optional[str] = None  # 'crew' or 'imposter'
    word: Optional[str] = None
    has_revealed: bool = False
    vote: Optional[str] = None


class Room:
    def __init__(self, room_code: str, host_id: str):
        self.room_code = room_code
        self.host_id = host_id
        self.players: List[Player] = [Player(id=host_id, name="Host")]
        self.status = "waiting"  # waiting, reveal, voting, results
        self.category: Optional[str] = None
        self.num_imposters: Optional[int] = None
        self.secret_word: Optional[str] = None
        self.votes: Dict[str, str] = {}  # playerId -> votedFor playerId
        self.eliminated_player_id: Optional[str] = None
        self.game_result: Optional[str] = None  # 'crew_win' or 'imposter_win'

    def to_public_dict(self):
        """Returns public room state without secrets"""
        return {
            "roomCode": self.room_code,
            "players": [{"id": p.id, "name": p.name} for p in self.players],
            "status": self.status,
            "category": self.category,
            "numImposters": self.num_imposters,
            "eliminatedPlayerId": self.eliminated_player_id,
            "gameResult": self.game_result,
        }

    def get_player_info(self, player_id: str):
        """Returns player's own role and word"""
        player = next((p for p in self.players if p.id == player_id), None)
        if not player:
            return None
        return {
            "role": player.role,
            "word": player.word,
            "category": self.category,
        }


def generate_room_code() -> str:
    return str(random.randint(1000, 9999))


async def broadcast_to_room(room_code: str, message: dict):
    """Broadcast message to all connected clients in a room"""
    if room_code in active_connections:
        disconnected = []
        for ws in active_connections[room_code]:
            try:
                await ws.send_json(message)
            except:
                disconnected.append(ws)
        # Remove disconnected websockets
        for ws in disconnected:
            active_connections[room_code].remove(ws)


@app.post("/api/create_room")
async def create_room():
    """Create a new game room"""
    room_code = generate_room_code()
    host_id = f"host_{datetime.now().timestamp()}_{random.random()}"
    
    room = Room(room_code, host_id)
    rooms[room_code] = room
    
    return {
        "roomCode": room_code,
        "hostId": host_id,
    }


@app.post("/api/join_room")
async def join_room(data: dict):
    """Join an existing room"""
    room_code = data.get("roomCode")
    player_name = data.get("playerName")
    
    if not room_code or not player_name:
        raise HTTPException(status_code=400, detail="Missing roomCode or playerName")
    
    if room_code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[room_code]
    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Game already started")
    
    player_id = f"player_{datetime.now().timestamp()}_{random.random()}"
    
    # Check if player already exists
    existing_player = next((p for p in room.players if p.id == player_id), None)
    if not existing_player:
        room.players.append(Player(id=player_id, name=player_name))
    else:
        existing_player.name = player_name
    
    # Broadcast updated player list
    await broadcast_to_room(room_code, {
        "type": "room_update",
        "data": room.to_public_dict(),
    })
    
    return {
        "playerId": player_id,
        "roomCode": room.room_code,
        "players": [{"id": p.id, "name": p.name} for p in room.players],
        "status": room.status,
    }


@app.post("/api/start_game")
async def start_game(data: dict):
    """Start the game (host only)"""
    room_code = data.get("roomCode")
    category = data.get("category")
    num_imposters = data.get("numImposters")
    host_id = data.get("hostId")
    
    if not all([room_code, category, num_imposters, host_id]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    if room_code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[room_code]
    if room.host_id != host_id:
        raise HTTPException(status_code=403, detail="Only host can start the game")
    
    if len(room.players) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 players")
    
    if category not in WORD_LISTS:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    # Pick random word
    words = WORD_LISTS[category]
    secret_word = random.choice(words)
    
    # Shuffle players and assign roles
    shuffled = room.players.copy()
    random.shuffle(shuffled)
    imposters = shuffled[:num_imposters]
    crew = shuffled[num_imposters:]
    
    # Assign roles
    for player in room.players:
        is_imposter = any(imp.id == player.id for imp in imposters)
        if is_imposter:
            player.role = "imposter"
            player.word = None
        else:
            player.role = "crew"
            player.word = secret_word
        player.has_revealed = False
    
    room.category = category
    room.num_imposters = num_imposters
    room.secret_word = secret_word
    room.status = "reveal"
    room.votes = {}
    
    # Send individual player info to each player
    for player in room.players:
        player_info = room.get_player_info(player.id)
        await broadcast_to_room(room_code, {
            "type": "player_info",
            "playerId": player.id,
            "data": player_info,
        })
    
    # Broadcast room update
    await broadcast_to_room(room_code, {
        "type": "room_update",
        "data": room.to_public_dict(),
    })
    
    return {"success": True, "status": room.status}


@app.get("/api/get_player_info")
async def get_player_info(roomCode: str, playerId: str):
    """Get player's own role and word"""
    if roomCode not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[roomCode]
    player_info = room.get_player_info(playerId)
    
    if not player_info:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return player_info


@app.get("/api/get_room_state")
async def get_room_state(roomCode: str):
    """Get public room state"""
    if roomCode not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[roomCode]
    return room.to_public_dict()


@app.post("/api/mark_revealed")
async def mark_revealed(data: dict):
    """Mark that player has seen reveal screen"""
    room_code = data.get("roomCode")
    player_id = data.get("playerId")
    
    if not room_code or not player_id:
        raise HTTPException(status_code=400, detail="Missing roomCode or playerId")
    
    if room_code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[room_code]
    player = next((p for p in room.players if p.id == player_id), None)
    if player:
        player.has_revealed = True
    
    all_revealed = all(p.has_revealed for p in room.players)
    
    # Automatically transition to voting when all players have revealed
    if all_revealed and room.status == "reveal":
        room.status = "voting"
        room.votes = {}
    
    # Broadcast update
    await broadcast_to_room(room_code, {
        "type": "room_update",
        "data": room.to_public_dict(),
    })
    
    return {"success": True, "allRevealed": all_revealed}


@app.post("/api/start_voting")
async def start_voting(data: dict):
    """Start voting phase (host only)"""
    room_code = data.get("roomCode")
    host_id = data.get("hostId")
    
    if not room_code or not host_id:
        raise HTTPException(status_code=400, detail="Missing roomCode or hostId")
    
    if room_code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[room_code]
    if room.host_id != host_id:
        raise HTTPException(status_code=403, detail="Only host can start voting")
    
    if room.status != "reveal":
        raise HTTPException(status_code=400, detail="Not in reveal phase")
    
    room.status = "voting"
    room.votes = {}
    
    # Broadcast update
    await broadcast_to_room(room_code, {
        "type": "room_update",
        "data": room.to_public_dict(),
    })
    
    return {"success": True, "status": room.status}


@app.post("/api/submit_vote")
async def submit_vote(data: dict):
    """Submit a vote"""
    room_code = data.get("roomCode")
    player_id = data.get("playerId")
    voted_for_id = data.get("votedForId")
    
    if not all([room_code, player_id, voted_for_id]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    if room_code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[room_code]
    if room.status != "voting":
        raise HTTPException(status_code=400, detail="Not in voting phase")
    
    room.votes[player_id] = voted_for_id
    
    # Check if all players have voted
    all_voted = all(room.votes.get(p.id) for p in room.players)
    
    if all_voted:
        # Calculate results
        vote_counts: Dict[str, int] = {p.id: 0 for p in room.players}
        for voted_for_id in room.votes.values():
            vote_counts[voted_for_id] = vote_counts.get(voted_for_id, 0) + 1
        
        # Find player with most votes
        eliminated_id = max(vote_counts.items(), key=lambda x: x[1])[0]
        room.eliminated_player_id = eliminated_id
        
        eliminated_player = next((p for p in room.players if p.id == eliminated_id), None)
        if eliminated_player and eliminated_player.role == "imposter":
            room.game_result = "crew_win"
        else:
            room.game_result = "imposter_win"
        
        room.status = "results"
    
    # Broadcast update
    await broadcast_to_room(room_code, {
        "type": "room_update",
        "data": room.to_public_dict(),
    })
    
    return {
        "success": True,
        "allVoted": all_voted,
        "status": room.status,
    }


@app.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    
    # Add to active connections
    if room_code not in active_connections:
        active_connections[room_code] = []
    active_connections[room_code].append(websocket)
    
    try:
        # Send initial room state if room exists
        if room_code in rooms:
            await websocket.send_json({
                "type": "room_update",
                "data": rooms[room_code].to_public_dict(),
            })
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for message with timeout to allow periodic checks
                data = await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                # Handle incoming messages if needed in the future
                # For now, just keep connection alive
            except asyncio.TimeoutError:
                # Timeout is fine, just continue the loop to keep connection alive
                continue
    except WebSocketDisconnect:
        pass
    finally:
        # Remove from active connections
        if room_code in active_connections:
            if websocket in active_connections[room_code]:
                active_connections[room_code].remove(websocket)
            if not active_connections[room_code]:
                del active_connections[room_code]


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

