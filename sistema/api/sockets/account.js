const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { buildBanPayload } = require("../services/banService");

/**
 * Namespace /account: una conexión por pestaña/dispositivo, disponible en TODA
 * la aplicación (no solo en mensajería). Se usa para avisar cambios de estado
 * de la cuenta, por ejemplo una sanción aplicada por un administrador.
 *
 * Evento emitido al usuario sancionado:
 *   account:banned { code, message, bannedUntil, banReason }
 */

let accountNamespace = null;
let ioServer = null;

// Caché en memoria de sanciones vigentes: permite rechazar acciones por socket
// en los milisegundos previos a la desconexión forzada.
const bannedUsers = new Map(); // userId -> payload

const isBannedInCache = (userId) => {
  const id = Number(userId);
  const ban = bannedUsers.get(id);
  if (!ban) return false;

  if (new Date(ban.bannedUntil).getTime() <= Date.now()) {
    bannedUsers.delete(id);
    return false;
  }

  return true;
};

const rememberBan = (userId, payload) => {
  bannedUsers.set(Number(userId), payload);
};

const forgetBan = (userId) => {
  bannedUsers.delete(Number(userId));
};

function setupAccount(io) {
  ioServer = io;
  accountNamespace = io.of("/account");

  accountNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.userId);

      if (!user) {
        return next(new Error("Usuario no encontrado"));
      }

      // Un usuario sancionado no puede reconectar: al cerrar la ventana y
      // volver a entrar, la restricción sigue vigente en el servidor.
      const ban = buildBanPayload(user);
      if (ban || isBannedInCache(user.userId)) {
        return next(new Error("account banned"));
      }

      socket.userId = Number(user.userId);
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  accountNamespace.on("connection", (socket) => {
    socket.join(`user_${socket.userId}`);

    socket.on("disconnect", () => {
      console.log("Account disconnected:", socket.id, socket.userId);
    });
  });
}

// Avisa a todas las pestañas/dispositivos del usuario.
function emitToAccount(userId, event, payload) {
  if (!accountNamespace) return;
  accountNamespace.to(`user_${Number(userId)}`).emit(event, payload);
}

// Cierra las conexiones del usuario en todos los namespaces después de dejar
// tiempo a que el evento de sanción llegue al navegador.
function scheduleDisconnect(userId, delayMs = 1200) {
  if (!ioServer) return;

  setTimeout(() => {
    for (const namespaceName of ["/", "/presence", "/account"]) {
      const namespace = ioServer.of(namespaceName);

      namespace.sockets.forEach((socket) => {
        if (Number(socket.userId) === Number(userId)) {
          socket.disconnect(true);
        }
      });
    }
  }, delayMs);
}

module.exports = {
  setupAccount,
  emitToAccount,
  scheduleDisconnect,
  rememberBan,
  forgetBan,
  isUserBanned: isBannedInCache,
};
