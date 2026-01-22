// client/src/types.ts

export type Player = 'X' | 'O';

export interface GameState {
  board: (Player | null)[];
  currentPlayer: Player;
  moveHistoryX: number[];
  moveHistoryO: number[];
  winner: Player | null;
  winningLine: [number, number, number] | null;
}

export interface Chat {
  id: string;
  sender: string;
  role: Player | 'Spectator'| 'System';
  message: string;
  timestamp: Date;
}

export interface Room {
  id: string;
  gameState: GameState;
  chat: Chat[];
  players: {
    X: { id: string; name: string } | null;
    O: { id: string; name: string } | null;
  };
  spectators: { id: string; name: string }[];
}

export interface CreateRoomResponse {
  success: boolean;
  roomId: string;
  playerRole: Player;
  room: Room;
  error?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId?: string;
  playerRole?: Player | null;
  room?: Room;
  isSpectator?: boolean;
  error?: string;
}

export interface MakeMoveResponse {
  success: boolean;
  gameState?: GameState;
  error?: string;
}