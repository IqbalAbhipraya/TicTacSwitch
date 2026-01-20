import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

let socket: Socket | null = null;

export const getSocket = () : Socket => {
    if (!socket) {
        socket = io(SERVER_URL, {
            autoConnect: false,
        });
    }
    return socket;
};

export const connectSocket = () => {
    const socket = getSocket();
    if (!socket.connected) {
        socket.connect();
    }
    return socket;
};

export const disconnectSocket = () => {
    const socket = getSocket();
    if (socket.connected) {
        socket.disconnect();
    }
    return socket;
};
