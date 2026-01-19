import { Player, GameState } from "./type";

const GAME_WINNING_CONDITION: readonly [number, number, number][] = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal \
    [2, 4, 6]  // Diagonal /
];

const MAX_PIECES_PER_PLAYER = 3;

export interface MoveResult {
    success: boolean;
    gameState?: GameState;
    error?: string;
}


export function createNewGame(): GameState {
    return {
        board: Array(9).fill(null),
        currentPlayer: 'X' as Player,
        moveHistoryX: [],
        moveHistoryO: [],
        winner: null
    };
}

export function checkWinner(board: (Player | null)[]): Player | null {
    for (const combination of GAME_WINNING_CONDITION) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] as Player;
        }
    }
    return null;
}

export function checkDraw(gameState: GameState): boolean {
    if (gameState.winner) return false;
    const isBoardFull = gameState.board.every(cell => cell !== null);    
    return isBoardFull && !gameState.winner;
}

export function makeMove(move: number, gameState: GameState, player: Player): MoveResult {
    if (gameState.currentPlayer !== player) {
        return {
            success: false,
            error: 'Not your turn'
        };
    }

    if (gameState.winner) {
        return {
            success: false,
            error: 'Game already finished'
        };
    }

    if (move < 0 || move > 8) {
        return {
            success: false,
            error: 'Invalid move position'
        };
    }

    if (gameState.board[move] !== null) {
        return {
            success: false,
            error: 'Cell already occupied'
        };
    }

    const newBoard = [...gameState.board];
    const moveHistoryX = [...gameState.moveHistoryX];
    const moveHistoryO = [...gameState.moveHistoryO];

    const currentMoveHistory = player === 'X' ? moveHistoryX : moveHistoryO;

    currentMoveHistory.push(move);

    if (currentMoveHistory.length > MAX_PIECES_PER_PLAYER) {
        const oldestMove = currentMoveHistory.shift()!;
        newBoard[oldestMove] = null;
    }

    newBoard[move] = player;

    const winner = checkWinner(newBoard);
   
    const isDraw = !winner && newBoard.every(cell => cell !== null);

    const newGameState: GameState = {
        board: newBoard,
        currentPlayer: player === 'X' ? 'O' : 'X',
        moveHistoryX,
        moveHistoryO,
        winner: winner || (isDraw ? 'Draw' : null)
    };

    return {
        success: true,
        gameState: newGameState
    };
}

export function getNextRemovalPosition(player: Player, gameState: GameState): number | null {
    const moveHistory = player === 'X' ? gameState.moveHistoryX : gameState.moveHistoryO;
    
    if (moveHistory.length >= MAX_PIECES_PER_PLAYER) {
        return moveHistory[0] ?? null;
    }
    
    return null;
}

export function isValidMove(move: number, gameState: GameState, player: Player): boolean {
    if (gameState.currentPlayer !== player) return false;
    if (gameState.winner) return false;
    if (move < 0 || move > 8) return false;
    if (gameState.board[move] !== null) return false;
    return true;
}

export function getGameStatus(gameState: GameState): string {
    if (gameState.winner === 'Draw') {
        return "It's a draw!";
    }
    if (gameState.winner) {
        return `Player ${gameState.winner} wins!`;
    }
    return `Player ${gameState.currentPlayer}'s turn`;
}

export function resetGame(): GameState {
    return createNewGame();
}

export function getValidMoves(gameState: GameState): number[] {
    if (gameState.winner) return [];
    
    return gameState.board
        .map((cell, index) => cell === null ? index : -1)
        .filter(index => index !== -1);
}

export function getPlayerMoveHistory(player: Player, gameState: GameState): number[] {
    return player === 'X' ? [...gameState.moveHistoryX] : [...gameState.moveHistoryO];
}