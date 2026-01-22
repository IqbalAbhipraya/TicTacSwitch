import { useEffect, useState } from 'react';
import './App.css';
import { getSocket } from './socket';

import Board from './components/Board';
import { BadgeWithIndicator } from './components/Badge';
import { PlayerCard } from './components/PlayerCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { RefreshCw } from 'lucide-react';
import ChatSection from './components/ChatSection';

import type { Chat, CreateRoomResponse, GameState, JoinRoomResponse, MakeMoveResponse, Player, Room } from './types';


const initialGameState: GameState = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  moveHistoryX: [],
  moveHistoryO: [],
  winner: null,
  winningLine: null
};

function App() {
  const [socket] = useState(() => getSocket());
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [roomId, setRoomId] = useState<string>('');
  const [myRole, setMyRole] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Chat[]>([]);
  const [players, setPlayers] = useState<Room['players']>({ X: null, O: null });
  const [status, setStatus] = useState('Not connected');

  // Socket connection and event listeners
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setConnected(true);
      setStatus('Connected');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
      setStatus('Disconnected');
    });

    socket.on('gameStart', (room: Room) => {
      console.log('Game started!', room);
      setGameState(room.gameState);
      setPlayers(room.players);
      setChatMessages(room.chat);
    });

    socket.on('gameStateUpdate', (newGameState: GameState) => {
      console.log('Game state updated:', newGameState);
      setGameState(newGameState);
    });

    socket.on('gameEnd', (finalGameState: GameState) => {
      console.log('Game ended:', finalGameState);
      setGameState(finalGameState);
    });

    socket.on('chatMessage', (message: Chat) => {
      console.log('New chat message:', message);
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('playerLeft', ({ playerName, playerRole }: { playerName: string; playerRole: Player }) => {
      console.log(`${playerName} (${playerRole}) left`);
      setPlayers(prev => ({
        ...prev,
        [playerRole]: null,
      }));
    });

    socket.on('spectatorJoined', ({ name }: { name: string }) => {
      console.log(`${name} joined as spectator`);
    });

    socket.on('roleSwitch', (room: Room) => {
      console.log('Roles switched!', room);
      
      setGameState(room.gameState);
      setPlayers(room.players);
      setChatMessages(room.chat);
      
      if (room.players.X?.id === socket.id) {
        setMyRole('X');
        setStatus(`Room ${roomId} - You are X`);
      } else if (room.players.O?.id === socket.id) {
        setMyRole('O');
        setStatus(`Room ${roomId} - You are O`);
      }
    });

    socket.on('becomePlayer', ({ room, role }: { room: Room; role: Player }) => {
      console.log('You became a player!', room, role);
      
      setGameState(room.gameState);
      setPlayers(room.players);
      setChatMessages(room.chat);
      setMyRole(role);
      setStatus(`Room ${roomId} - You are ${role}`);
    });

    socket.on('roomUpdate', (room: Room) => {
      console.log('Room updated:', room);
      
      setGameState(room.gameState);
      setPlayers(room.players);
      setChatMessages(room.chat);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameStart');
      socket.off('gameStateUpdate');
      socket.off('gameEnd');
      socket.off('chatMessage');
      socket.off('playerLeft');
      socket.off('spectatorJoined');
      socket.off('roleSwitch');
      socket.off('becomePlayer');
      socket.off('roomUpdate');
    };
  }, [socket, roomId]);

  const createRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    socket.emit('createRoom', playerName, (response: CreateRoomResponse) => {
      console.log('Create room response:', response);
      if (response.success) {
        setRoomId(response.roomId);
        setMyRole(response.playerRole);
        setGameState(response.room.gameState);
        setPlayers(response.room.players);
        setChatMessages(response.room.chat);
        setStatus(`Room ${response.roomId} - You are ${response.playerRole}`);

      } else {
        alert(`Failed to create room: ${response.error}`);
      }
    });
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomInput.trim()) {
      alert('Please enter your name and room ID');
      return;
    }

    socket.emit('joinRoom', roomInput.toUpperCase(), playerName, (response: JoinRoomResponse) => {
      console.log('Join room response:', response);

      if (response.success && response.room) {
          setRoomId(response.roomId!);
          setMyRole(response.playerRole || null);
          setGameState(response.room.gameState);
          setPlayers(response.room.players);
          setChatMessages(response.room.chat);
          setStatus(`Room ${response.roomId} - You are ${response.playerRole || 'Spectator'}`);
          
      } else {
        alert(`Failed to join room: ${response.error}`);
      }
    });
  };

  const onSquareClick = (index: number) => {
    if (!roomId || !myRole) {
      console.log('Cannot make move: not in game');
      return;
    }

    console.log(`Square ${index} clicked`);
    socket.emit('makeMove', roomId, index, (response: MakeMoveResponse) => {
      console.log('Move response:', response);
      if (!response.success) {
        alert(`Move failed: ${response.error}`);
      }
    });
  };

  const sendMessage = (message: string) => {
    if (!message.trim() || !roomId) return;
    
    socket.emit('sendMessage', roomId, message);
  };

  const resetGame = () => {
    if (!roomId) return;
    socket.emit('resetGame', roomId);
  };

  const switchRole = () => {
    if (!roomId || !myRole) return;
    if (players.X === null || players.O === null) {
      alert('Cannot switch role: not enough players');
      return;
    }
    socket.emit('switchRole', roomId);
  };

  const leaveRoom = () => {    
    if (roomId) {
      socket.emit('leaveRoom', roomId);
    }
    
    // Reset state
    setRoomId('');
    setMyRole(null);
    setGameState(initialGameState);
    setPlayers({ X: null, O: null });
    setChatMessages([]);
    setRoomInput('');
    setStatus('Connected');
  };

  const indicatorColor = gameState.currentPlayer === 'X' ? 'blue' : 'purple';

  const room: Room = {
    id: roomId,
    gameState,
    chat: chatMessages,
    players,
    spectators: []
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {!roomId ? (
         <div className="max-w-md mx-auto mt-20 px-4">
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-4xl font-bold text-gray-800">
              Tic-Tac-Shift
            </h1>
            <p className="text-sm text-gray-500">Endless Fun with Complex Game of Tic-Tac-Toe</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Join Game</CardTitle>
              <CardDescription className="text-center">
                Create a new room or join an existing one
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500"></span>
                </div>
              </div>

              <Button
                onClick={createRoom}
                disabled={!connected || !playerName.trim()}
                className="w-full bg-slate-800 hover:bg-slate-700"
                size="lg"
              >
                Create New Room
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID</Label>
                <Input
                  id="roomId"
                  type="text"
                  placeholder="Enter room code"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  className="uppercase"
                  maxLength={7}
                />
              </div>

              <Button
                onClick={joinRoom}
                disabled={!connected || !playerName.trim() || !roomInput.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Game Room */
          <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen gap-8 lg:gap-16">
            <div className="flex lg:flex-col flex-row items-center justify-center gap-4">
              <PlayerCard room={room} role="X" />
              <h1 className='text-2xl font-bold'>VS</h1>
              <PlayerCard room={room} role="O" />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <h1 className='text-2xl font-bold'>{status}</h1>

              <button onClick={leaveRoom} className="bg-red-500 text-white px-4 py-1 rounded-lg text-sm font-semibold hover:bg-red-600">Leave Room</button>

              <BadgeWithIndicator text={gameState.winner ? `Player ${gameState.winner} wins!` : `Player ${gameState.currentPlayer}'s turn`} indicatorColor={gameState.winner ? 'yellow' : indicatorColor}/>
              
              <Board gameState={gameState} onSquareClick={onSquareClick} myRole={myRole}/>
              {myRole && <button onClick={resetGame} className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700">Reset Game</button>}
            </div>
            <div className="flex flex-col items-center justify-center gap-4">
              {myRole && <button onClick={switchRole} className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 flex items-center gap-2"><RefreshCw size={25} strokeWidth={2.5} /> Switch Role</button>}
              <ChatSection messages={chatMessages} onSendMessage={sendMessage} disabled={!roomId} />            
            </div>
          </div>
      )}
    </div>
  );
}

export default App;