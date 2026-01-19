import Square from "./Square";
import type { GameState, Player } from "../types";

interface BoardProps {
    gameState: GameState;
    onSquareClick: (index: number) => void;
    myRole: Player | null;
}

export default function Board({ gameState, onSquareClick, myRole }: BoardProps) {
    const { board, moveHistoryX, moveHistoryO, currentPlayer, winner } = gameState;

    const oldestX = moveHistoryX.length >= 3 ? moveHistoryX[0] : null;
    const oldestO = moveHistoryO.length >= 3 ? moveHistoryO[0] : null;

    const isMyTurn = myRole === currentPlayer;
    const gameEnded = winner !== null;

    return (
        <div className="grid grid-cols-3 max-w-md mx-auto p-4">
            {board.map((value, index) => {
                const isOldest =
                    (index === oldestX && value === 'X') ||
                    (index === oldestO && value === 'O');

                const isDisabled =
                    !isMyTurn ||
                    gameEnded ||
                    value !== null ||
                    !myRole; // Can't play if not a player

                return (
                    <Square
                        key={index}
                        value={value}
                        onClick={() => {
                            onSquareClick(index);
                        }}
                        isOldest={isOldest}
                        disabled={isDisabled}
                    />
                );
            })}
        </div>
    );
}

