import { io } from "socket.io-client";
import { API_URL } from "./http";

// Conexión global al namespace /account: existe en toda la aplicación, no solo
// en mensajería, para recibir avisos de la cuenta (por ejemplo un baneo).
let socket = null;

export function getAccountSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!socket) {
    socket = io(`${API_URL}/account`, {
      auth: { token },
      reconnection: true,
    });
  }

  return socket;
}

export function disconnectAccountSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
