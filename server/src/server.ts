import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { GameState, Player, Chat } from './type';
import { createNewGame, makeMove, getGameStatus, resetGame, MoveResult } from './gameLogic'

const app = express();
const httpServer = createServer(app);

app.use(cors());

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

export interface Room {
    id: string;
    gameState: GameState;
    chat: Chat[];
    players: {
        X: {id: string, name: string} | null;
        O: {id: string, name: string} | null;
    }
    spectators: {id: string, name: string}[];
}

const rooms = new Map<string, Room>();

function createRoomId(): string {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
}

function getPlayerRole(room: Room, socketId: string): Player | null {
    if (room.players.X?.id === socketId) {
        return 'X';
    } else if (room.players.O?.id === socketId) {
        return 'O';
    }
    return null;
}

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create room
    socket.on('createRoom', (playerName: string, callback) => {
        const roomId = createRoomId();
        const room: Room = {
            id: roomId,
            gameState: createNewGame(),
            chat: [],
            players: {
                X: {id: socket.id, name: playerName},
                O: null,
            },
            spectators: [],
        };
        rooms.set(roomId, room);
        socket.join(roomId);

        const systemMessage: Chat = {
            id: Date.now().toString(),
            sender: 'System',
            role: 'System',
            message: 'Welcome to the game!',
            timestamp: new Date(),
        };
        room.chat.push(systemMessage);

        callback({
            success: true,
            roomId,
            playerRole: 'X' as Player,
            room
        });

        console.log(`Room created: ${roomId}`);
        console.log(`Player ${playerName} joined room ${roomId}`);
    });

    // Join room
    socket.on('joinRoom', (roomId: string, playerName: string, callback) => {
        const room = rooms.get(roomId);
        if (!room) {
            callback({
                success: false,
                error: 'Room not found',
            });
            return;
        }


        // Join room as spectator if player O is not null (Filled)
        if (room.players.O !== null && room.players.X !== null) {
            room.spectators.push({id: socket.id, name: playerName});
            socket.join(roomId);
            
            const systemMessage: Chat = {
                id: Date.now().toString(),
                sender: 'System',
                role: 'System',
                message: `${playerName} joined the room as Spectator`,
                timestamp: new Date(),
            };
            room.chat.push(systemMessage);
            
            callback({
                success: true,
                playerRole: null,
                roomId,
                room,
                isSpectator: true,
            });

            io.to(roomId).emit('spectatorJoined', {name: playerName});
            return
        }

        // Determine which role is missing and assign the player
        const roleMissing: Player = room.players.X === null ? 'X' : 'O';

        room.players[roleMissing] = {
            id: socket.id,
            name: playerName,
        };
        socket.join(roomId);

        const systemMessage: Chat = {
            id: Date.now().toString(),
            sender: 'System',
            role: 'System',
            message: `${playerName} joined the room as Player ${roleMissing}`,
            timestamp: new Date(),
        };
        room.chat.push(systemMessage);

        callback({
            success: true,
            roomId,
            playerRole: roleMissing,
            room,
        });

        io.to(roomId).emit('gameStart', room);
        
        console.log(`Player ${playerName} joined room ${roomId}`);
    });

    // Make move
    socket.on('makeMove', (roomId: string, move: number, callback) => {
        const room = rooms.get(roomId);
        if (!room) {
            callback({
                success: false,
                error: 'Room not found',
            });
            return;
        }

        const playerRole = getPlayerRole(room, socket.id);
        if (!playerRole) {
            callback({
                success: false,
                error: 'You are not a player in this room',
            });
            return;
        }

        const result: MoveResult = makeMove(move, room.gameState , playerRole);
        if (!result.success) {
            callback({
                result
            });
            return;
        }

        room.gameState = result.gameState!;
        callback({
            success: true,
            gameState: room.gameState,
        });

        io.to(roomId).emit('gameStateUpdate', room.gameState);

        if (room.gameState.winner) {
            const statusMessage: Chat = {
                id: Date.now().toString(),
                sender: 'System',
                role: 'System',
                message: getGameStatus(room.gameState),
                timestamp: new Date()
            };
            room.chat.push(statusMessage);
            io.to(roomId).emit('gameEnd', room.gameState);
            io.to(roomId).emit('chatMessage', statusMessage);
        }
    });

    socket.on('resetGame', (roomId: string) => {
        const room = rooms.get(roomId);
        if (!room) {
            return;
        }
        const playerRole = getPlayerRole(room, socket.id);
        if (!playerRole) {
            return;
        }
        room.gameState = resetGame();
        
        const systemMessage: Chat = {
            id: Date.now().toString(),
            sender: 'System',
            role: 'System',
            message: 'Game reset',
            timestamp: new Date()
        };
        room.chat.push(systemMessage);
        io.to(roomId).emit('chatMessage', systemMessage);
        io.to(roomId).emit('gameStateUpdate', room.gameState);
    });

    socket.on('sendMessage', (roomId: string, message: string) => {
        const room = rooms.get(roomId);
        if (!room) {
            return;
        }

        let playerRole: Player | 'Spectator' | null = getPlayerRole(room, socket.id);
        let senderName: string;

        if (playerRole) {
            // Player sending message - use their name
            senderName = room.players[playerRole]?.name || playerRole;
        } else {
            // Spectator sending message
            const spectator = room.spectators.find(s => s.id === socket.id);
            if (spectator) {
                senderName = spectator.name;
                playerRole = 'Spectator';
            } else {
                // Unknown sender
                return;
            }
        }

        const chatMessage: Chat = {
            id: Date.now().toString(),
            sender: senderName,
            role: playerRole,
            message: message,
            timestamp: new Date()
        };

        room.chat.push(chatMessage);
        io.to(roomId).emit('chatMessage', chatMessage);
    });


    socket.on('leaveRoom', (roomId: string) => {
        const room = rooms.get(roomId);
        if (!room) {
            return;
        }
        const playerRole = getPlayerRole(room, socket.id);
        if (playerRole) {
            const playerName = room.players[playerRole]?.name;
            room.players[playerRole] = null;

            const systemMessage: Chat = {
                id: Date.now().toString(),
                sender: 'System',
                role: 'System',
                message: `${playerName} left the room`,
                timestamp: new Date()
            };
            room.chat.push(systemMessage);

            io.to(roomId).emit('chatMessage', systemMessage);
            io.to(roomId).emit('playerLeft', {playerName, playerRole});

            if (room.spectators.length > 0) {
                const spectator = room.spectators[0]!;
                let newRole: Player | null = null;
                
                if (room.players.X === null) {
                    room.players.X = spectator;
                    newRole = 'X';
                    room.spectators = room.spectators.filter(s => s.id !== spectator.id);
                } else if (room.players.O === null) {
                    room.players.O = spectator;
                    newRole = 'O';
                    room.spectators = room.spectators.filter(s => s.id !== spectator.id);
                }
                
                if (newRole) {
                    io.to(spectator.id).emit('becomePlayer', { room, role: newRole });
                    
                    io.to(roomId).emit('roomUpdate', room);
                    
                    const systemMessage: Chat = {
                        id: Date.now().toString(),
                        sender: 'System',
                        role: 'System',
                        message: `${spectator.name} became Player ${newRole}`,
                        timestamp: new Date()
                    };
                    room.chat.push(systemMessage);
                    io.to(roomId).emit('chatMessage', systemMessage);
                }
            }
        } else {
            const spectator = room.spectators.find(s => s.id === socket.id) || null;
            const playerName = spectator?.name || 'Unknown';
            room.spectators = room.spectators.filter(s => s.id !== socket.id);
            const systemMessage: Chat = {
                id: Date.now().toString(),
                sender: 'System',
                role: 'System',
                message: `${playerName} left the room`,
                timestamp: new Date()
            };
            room.chat.push(systemMessage);

            io.to(roomId).emit('chatMessage', systemMessage);
        }

        socket.leave(roomId);
    });

    socket.on('switchRole', (roomId: string) => {
        const room = rooms.get(roomId);
        if (!room) {
            return;
        }
        const playerRole = getPlayerRole(room, socket.id);
        if (!playerRole) {
            return;
        }
        
        const playerXName = room.players.X?.name || 'Unknown';
        const playerOName = room.players.O?.name || 'Unknown';
        
        const tempX = room.players.X;
        room.players.X = room.players.O;
        room.players.O = tempX;
        
        room.gameState = resetGame();
        
        const systemMessage: Chat = {
            id: Date.now().toString(),
            sender: 'System',
            role: 'System',
            message: `${playerXName} and ${playerOName} switched roles!`,
            timestamp: new Date()
        };
        room.chat.push(systemMessage);
        
        io.to(roomId).emit('roleSwitch', room);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        rooms.forEach((room, roomId) => {
            const playerRole = getPlayerRole(room, socket.id);
            if (playerRole) {
                const playerName = room.players[playerRole]?.name;
                room.players[playerRole] = null;

                const systemMessage: Chat = {
                    id: Date.now().toString(),
                    sender: playerRole,
                    role: playerRole,
                    message: `${playerName} left the room`,
                    timestamp: new Date()
                };
                room.chat.push(systemMessage);

                io.to(roomId).emit('chatMessage', systemMessage);
                io.to(roomId).emit('playerLeft', {playerName, playerRole});

                if (!room.players.X && !room.players.O && room.spectators.length === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted`);
                }
            } else {
                room.spectators = room.spectators.filter(s => s.id !== socket.id);
            }
        })
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


