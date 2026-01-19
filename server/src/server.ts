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

interface Room {
    id: string;
    gameState: GameState;
    chat: Chat[];
    players: {
        X: {id: string, name: string} | null;
        O: {id: string, name: string} | null;
    }
    spectators: string[];
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
            sender: 'X',
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
        if (room.players.O !== null) {
            room.spectators.push(socket.id);
            socket.join(roomId);
            callback({
                success: true,
                playerRole: null,
                roomId,
                isSpectator: true,
            });

            io.to(roomId).emit('spectatorJoined', {name: playerName});
            return
        }

        // Join room as player O
        room.players.O = {
            id: socket.id,
            name: playerName,
        };
        socket.join(roomId);

        const systemMessage: Chat = {
            id: Date.now().toString(),
            sender: 'O',
            message: `${playerName} joined the room`,
            timestamp: new Date(),
        };
        room.chat.push(systemMessage);

        callback({
            success: true,
            roomId,
            playerRole: 'O' as Player,
            room,
        });

        io.to(roomId).emit('gameStart', room);
        io.to(roomId).emit('chatMessage', systemMessage);
        
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
                sender: playerRole,
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
            sender: playerRole,
            message: 'Game reset',
            timestamp: new Date()
        };
        room.chat.push(systemMessage);
        io.to(roomId).emit('chatMessage', systemMessage);
        io.to(roomId).emit('gameStateUpdate', room.gameState);
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
                sender: playerRole,
                message: `${playerName} left the room`,
                timestamp: new Date()
            };
            room.chat.push(systemMessage);

            io.to(roomId).emit('chatMessage', systemMessage);
            io.to(roomId).emit('playerLeft', {playerName, playerRole});
        } else {
            room.spectators = room.spectators.filter(id => id !== socket.id);
        }

        socket.leave(roomId);
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
                room.spectators = room.spectators.filter(id => id !== socket.id);
            }
        })
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


