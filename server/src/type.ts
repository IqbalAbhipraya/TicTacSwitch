export type Player = 'X' | 'O';

export interface GameState {
    board: (Player | null)[];
    currentPlayer: Player;
    moveHistoryX: number[];
    moveHistoryO: number[];
    winner: Player | 'Draw' | null;
    winningLine: [number, number, number] | null;
}

export interface Chat {
    id: string;
    sender: Player;
    message: string;
    timestamp: Date;
}