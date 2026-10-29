const jwt = require("jsonwebtoken");
const { getFriendIds } = require("../services/friendsService");

/**
 * Presencia (en línea / desconectado) usando un namespace propio de socket.io: /presence
 * Es independiente del chat, así que no interfiere con sockets/chat.js.
 *
 * Eventos que emite el servidor (cada usuario está en la sala "user:<id>"):
 *   presence:update  { userId, online }   -> a los amigos de quien se conecta/desconecta
 *   friends:changed                       -> cuando cambia una solicitud o amistad
 */

// Si el usuario recarga la página, el socket se cae y vuelve en segundos:
// esperamos este tiempo antes de avisar "desconectado" para que no parpadee.
const OFFLINE_GRACE_MS = 3000;

const sockets = new Map();       // userId -> Set(socket.id)
const offlineTimers = new Map(); // userId -> timeout pendiente
let presenceNs = null;

// Un usuario cuenta como en línea mientras tenga algún socket abierto
// (o esté dentro del período de gracia, que es lo que ya se les informó a sus amigos)
const isOnline = (userId) => {
  const id = Number(userId);
  return (sockets.get(id)?.size ?? 0) > 0 || offlineTimers.has(id);
};

// Envía un evento a todas las pestañas/dispositivos de un usuario
const emitToUser = (userId, event, payload) => {
  presenceNs?.to(`user:${Number(userId)}`).emit(event, payload);
};

// Avisa a los amigos del usuario que se conectó o desconectó
const announce = async (userId, online) => {
  try {
    const friendIds = await getFriendIds(userId);
    friendIds.forEach((friendId) =>
      emitToUser(friendId, "presence:update", { userId, online })
    );
  } catch (error) {
    console.error("Error al avisar presencia:", error.message);
  }
};

function setupPresence(io) {
  presenceNs = io.of("/presence");

  // Solo usuarios con un JWT válido
  presenceNs.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = Number(payload.userId);
      next();
    } catch {
      next(new Error("No autorizado"));
    }
  });

  presenceNs.on("connection", (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);

    // Si volvió dentro del período de gracia, cancelamos el aviso de "desconectado"
    const pendingTimer = offlineTimers.get(userId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      offlineTimers.delete(userId);
    }

    const userSockets = sockets.get(userId) ?? new Set();
    const wasOnline = userSockets.size > 0 || Boolean(pendingTimer);
    userSockets.add(socket.id);
    sockets.set(userId, userSockets);

    if (!wasOnline) announce(userId, true);

    socket.on("disconnect", () => {
      const current = sockets.get(userId);
      current?.delete(socket.id);
      if (current && current.size > 0) return; // le quedan otras pestañas abiertas

      sockets.delete(userId);
      const timer = setTimeout(() => {
        offlineTimers.delete(userId);
        if (!sockets.has(userId)) announce(userId, false);
      }, OFFLINE_GRACE_MS);
      offlineTimers.set(userId, timer);
    });
  });
}

module.exports = { setupPresence, isOnline, emitToUser };