import Square from "./Square";
import type { GameState, Player } from "../types";

interface BoardProps {
    gameState: GameState;
    onSquareClick: (index: number) => void;
    myRole: Player | null;
}

export default function Board({ gameState, onSquareClick, myRole }: BoardProps) {
    const { board, moveHistoryX, moveHistoryO, currentPlayer, winner } = gameState;

    const oldestX = moveHistoryX.length >= 3 && currentPlayer === 'X' ? moveHistoryX[0] : null;
    const oldestO = moveHistoryO.length >= 3 && currentPlayer === 'O' ? moveHistoryO[0] : null;

    const isMyTurn = myRole === currentPlayer;
    const gameEnded = winner !== null;

    const winningLine = winner ? gameState.winningLine : null;

    return (
        <div 
            className="w-[32rem] rounded-3xl p-8 shadow-2xl bg-white"
            style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            <div className="grid grid-cols-3 gap-2">
                {board.map((value, index) => {
                    const isOldest =
                        (index === oldestX && value === 'X') ||
                        (index === oldestO && value === 'O');

                    const isDisabled =
                        !isMyTurn ||
                        gameEnded ||
                        value !== null ||
                        !myRole;

                    return (
                        <Square
                            key={index}
                            value={value}
                            onClick={() => {
                                onSquareClick(index);
                            }}
                            isOldest={isOldest}
                            disabled={isDisabled}
                            isWinner={winningLine?.includes(index) ?? false}
                        />
                    );
                })}
            </div>
        </div>
    );
}

