import Badge from "./Badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import type { Room } from "../types"
import { Crown } from "lucide-react"

interface PlayerCardProps {
    room: Room
    role: String
}

export const PlayerCard = ({ room, role }: PlayerCardProps) => {

    const { moveHistoryX, moveHistoryO, currentPlayer, winner } = room.gameState;

    const name = role === 'X' ? room.players.X?.name || 'Waiting for Player...' : room.players.O?.name || 'Waiting for Player...';
    const moves = role === 'X' ? moveHistoryX.length : moveHistoryO.length;
    const isMyTurn = role === currentPlayer;

    return (
        <div className="flex flex-col items-center gap-4">
            {(winner && winner === role) && (
                <Crown 
                    size={80} 
                    strokeWidth={2}
                    style={{
                        stroke: '#DAA520',
                        fill: '#FFD700',
                        filter: `
                            drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))
                            drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))
                            drop-shadow(0 0 40px rgba(255, 215, 0, 0.3))
                        `
                    }}
                />
            )}
            <Card className={`w-64 h-[10rem] flex flex-col justify-between ${isMyTurn && !winner ? 'border-4 border-green-500' : ''} ${winner && winner === role ? 'border-4 border-yellow-500' : ''}`}>
                <CardHeader className="flex-1 flex flex-col justify-center">
                    <CardTitle className="text-xl font-bold">{name}</CardTitle>
                    <CardDescription>
                            Player {role}
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                  
                </CardFooter>
            </Card>
        </div>

    )
}