// Una unica conexion Socket.IO compartida por toda la pagina de mensajes.
import { io } from "socket.io-client";
import { API_URL, getToken } from "./messageService";

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io(API_URL, {
            // El backend lee el token en socket.handshake.auth.token
            auth: (cb) => cb({ token: getToken() })
        });
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
