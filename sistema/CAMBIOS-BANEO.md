# Baneo de usuarios — archivos completos

Documento generado desde los archivos reales del proyecto. Cada bloque contiene el archivo **completo**, listo para copiar.

> Nota: `fronten/lost-in-music/src/components/Register.jsx` aparece modificado en `git status`, pero ese cambio ya existía antes de esta implementación y no forma parte del sistema de baneo, por eso no se incluye.

## Índice

1. Backend
   - `api/models/User.js`
   - `api/config/migrations.js`
   - `api/services/banService.js`
   - `api/middlewares/auth.js`
   - `api/controllers/users.js`
   - `api/controllers/admin.js`
   - `api/sockets/account.js`
   - `api/sockets/presence.js`
   - `api/sockets/chat.js`
   - `api/index.js`
2. Frontend
   - `src/services/session.js`
   - `src/services/accountSocket.js`
   - `src/services/adminApi.js`
   - `src/hooks/sessionContext.js`
   - `src/components/BanModal.jsx`
   - `src/components/SessionGuard.jsx`
   - `src/styles/BanModal.css`
   - `src/pages/admin.jsx`
   - `src/styles/admin.css`
   - `src/components/login.jsx`
   - `src/components/header.jsx`
   - `src/App.jsx`

---

## `api/models/User.js`

````js
const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")
const Role = require("./Role");

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },

  username: { //
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  description: { //
    type: DataTypes.TEXT,
    allowNull: false,
  },

  birthDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  gender: {
  type: DataTypes.ENUM('Femenino', 'Masculino', 'Otro', 'PrefieroNoDecir', 'NoBinario'),
  allowNull: false,
  },
  DVH: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  idRole: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  eliminated: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },
  followerAmount: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  followingAmount: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  profilePhoto: { //
    type: DataTypes.TEXT('long'), // Permite guardar cadenas Base64 muy grandes
    allowNull: false,
  },
  banner: { //
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  friendId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  ubication: { //
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  penaltyDate: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  // Sanción temporal aplicada por un administrador.
  // bannedUntil null = sin sanción vigente.
  bannedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  banReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },

});

User.belongsTo(Role, {
  foreignKey: "idRole",
  targetKey: "idRole", 
});

module.exports = {
  User
};````

---

## `api/config/migrations.js`

````js
const { DataTypes } = require("sequelize");
const sequelize = require("./db");

// Columnas que se agregaron al integrar la mensajeria completa en el modelo Message.
// sequelize.sync() crea la tabla si no existe, pero NO agrega columnas nuevas a una
// tabla ya creada con la version anterior del backend. Esto completa esa migracion
// sin usar alter:true (que podria tocar el resto del esquema).
const MESSAGE_COLUMNS = {
    receiverId: {
        // Se agrega como NULL para no romper filas historicas que no tienen receptor.
        // Las filas nuevas siempre se crean con receptor (allowNull:false en el modelo).
        type: DataTypes.INTEGER,
        allowNull: true
    },
    messageType: {
        type: DataTypes.ENUM("text", "image", "file"),
        allowNull: false,
        defaultValue: "text"
    },
    fileUrls: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deletedForAll: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    deletedBySender: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    deletedByReceiver: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    editedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    replyToMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
};

async function ensureMessagesColumns() {
    const queryInterface = sequelize.getQueryInterface();

    let table;
    try {
        table = await queryInterface.describeTable("messages");
    } catch (error) {
        // La tabla no existe todavia: sequelize.sync() la crea completa en el proximo arranque.
        console.warn("No se pudo revisar la tabla messages:", error.message);
        return;
    }

    for (const [name, definition] of Object.entries(MESSAGE_COLUMNS)) {
        if (table[name]) continue;

        await queryInterface.addColumn("messages", name, definition);
        console.log(`Columna agregada a messages: ${name}`);
    }
}

// Columnas del modelo User que quedaron desactualizadas en tablas creadas con
// versiones anteriores: profilePhoto se guarda como data URL base64 (mucho mas
// grande que un VARCHAR(255)) y el enum de gender no contemplaba 'NoBinario'.
const USERS_GENDER_VALUES = [
    "Femenino",
    "Masculino",
    "Otro",
    "PrefieroNoDecir",
    "NoBinario"
];

async function ensureUsersColumns() {
    const queryInterface = sequelize.getQueryInterface();

    let table;
    try {
        table = await queryInterface.describeTable("users");
    } catch (error) {
        // La tabla no existe todavia: sequelize.sync() la crea completa en el proximo arranque.
        console.warn("No se pudo revisar la tabla users:", error.message);
        return;
    }

    const profilePhotoType = String(table.profilePhoto?.type || "").toUpperCase();
    if (table.profilePhoto && profilePhotoType !== "LONGTEXT") {
        await queryInterface.changeColumn("users", "profilePhoto", {
            type: DataTypes.TEXT("long"),
            allowNull: false
        });
        console.log("Columna users.profilePhoto ampliada a LONGTEXT (fotos en base64)");
    }

    const genderType = String(table.gender?.type || "");
    if (table.gender && !USERS_GENDER_VALUES.every((value) => genderType.includes(value))) {
        await queryInterface.changeColumn("users", "gender", {
            type: DataTypes.ENUM(...USERS_GENDER_VALUES),
            allowNull: false
        });
        console.log("Columna users.gender actualizada con las opciones actuales");
    }

    // Columnas de sanción: sequelize.sync() no las agrega a tablas ya existentes.
    const banColumns = {
        bannedUntil: {
            type: DataTypes.DATE,
            allowNull: true
        },
        banReason: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    };

    for (const [name, definition] of Object.entries(banColumns)) {
        if (table[name]) continue;

        await queryInterface.addColumn("users", name, definition);
        console.log(`Columna agregada a users: ${name}`);
    }
}

module.exports = { ensureMessagesColumns, ensureUsersColumns };
````

---

## `api/services/banService.js`

````js
// Estado de las sanciones (baneos temporales) de los usuarios.
// La vigencia SIEMPRE se calcula con bannedUntil contra la fecha actual:
// una sanción vencida deja de bloquear aunque no se haya limpiado la fila.

const BAN_CODE = "BANNED";

// Devuelve la fecha de vencimiento si la sanción sigue vigente, o null.
const getBanExpiration = (user) => {
  if (!user || !user.bannedUntil) return null;

  const until = new Date(user.bannedUntil);
  if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) return null;

  return until;
};

const isUserBanned = (user) => Boolean(getBanExpiration(user));

// Limpia los datos de una sanción ya vencida (se llama al validar la cuenta).
const clearExpiredBan = async (user) => {
  if (!user || !user.bannedUntil || getBanExpiration(user)) return;

  await user.update({ bannedUntil: null, banReason: null });
};

// Respuesta uniforme para HTTP y sockets.
const buildBanPayload = (user) => {
  const until = getBanExpiration(user);
  if (!until) return null;

  return {
    code: BAN_CODE,
    message: `Tu cuenta está suspendida temporalmente hasta el ${until.toLocaleString("es-AR")}.`,
    bannedUntil: until.toISOString(),
    banReason: user.banReason || null,
  };
};

module.exports = {
  BAN_CODE,
  getBanExpiration,
  isUserBanned,
  clearExpiredBan,
  buildBanPayload,
};
````

---

## `api/middlewares/auth.js`

````js
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const Role = require('../models/Role');
const { buildBanPayload, clearExpiredBan } = require('../services/banService');


const checkToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(404).json({
                
                message: 'Usuario no encontrado',
                
            });
        }

        // Una sanción vigente bloquea CUALQUIER endpoint autenticado.
        const ban = buildBanPayload(user);
        if (ban) {
            return res.status(403).json(ban);
        }

        // Sanción vencida: se limpia para que la cuenta vuelva a estar habilitada.
        await clearExpiredBan(user);

        req.user = user;

        next();

    } catch (error) {
        console.error(error);
        return res.status(401).json({
            message: 'Token inválido o expirado'
        });
    }
};

// Debe usarse siempre después de checkToken.
const checkAdmin = async (req, res, next) => {
    try {
        const role = await Role.findByPk(req.user.idRole);

        if (!role || role.role !== 'Admin') {
            return res.status(403).json({
                message: 'No está autorizado para realizar esta acción'
            });
        }

        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al verificar los permisos'
        });
    }
};

const IsAuth = async (req, res, next) => {
    const permission = req.permission
    const idRole = req.user.idRole
    console.log(permission)

    const [rows] = await pool.query(`SELECT p.permission FROM Permission p 
        JOIN PermissionRole pr 
        ON pr.permissionId = p.permissionId
        WHERE pr.idRole = ?`, [idRole]); 

    permissionList = rows.map(p => p.permission)

    const hasPermission = permissionList.includes(permission)

    if (!hasPermission){
        return res.status(403).json({message : "No está autorizado"})
    }
    else(
        res.send(200).json({message: "permiso concedido"})
    )
    
    next()

} 

module.exports = {
    checkToken,
    checkAdmin,
    IsAuth
};````

---

## `api/controllers/users.js`

````js
const { User } = require("../models/User");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { buildBanPayload, clearExpiredBan } = require("../services/banService");


const Login = async (req, res) => {
  const { username, password } = req.body;

  console.log({
    username: req.body.username,
    hasPassword: Boolean(req.body.password),
  });

  if (!username || !password) {
    return res.status(400).json({ message: "username o password faltante" });
  }

  try {
    // acepta login por username O por email (tu input es "correo o usuario")
    const user = await User.findOne({
      where: { [Op.or]: [{ username }, { email: username }] },
    });

    if (!user)
      return res.status(400).json({ message: "Usuario no encontrado" });

    const compare = await bcrypt.compare(password, user.password);
    if (!compare)
      return res.status(400).json({ message: "Usuario o password incorrecta" });

    // Sanción vigente: no se entrega token aunque las credenciales sean correctas.
    const ban = buildBanPayload(user);
    if (ban) {
      return res.status(403).json(ban);
    }

    // Sanción vencida: se limpia y el usuario puede volver a ingresar normalmente.
    await clearExpiredBan(user);

    const token = jwt.sign(
      { userId: user.userId, idRole: user.idRole },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    // UNA sola respuesta, con el rol incluido
    return res.json({ token, idRole: user.idRole });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

// GET /session -> valida el token y confirma que la cuenta no está sancionada.
// checkToken ya rechazó con 403 { code: "BANNED" } si la sanción está vigente.
const GetSession = async (req, res) => {
  const user = req.user;

  return res.status(200).json({
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      idRole: user.idRole,
      profilePhoto: user.profilePhoto,
    },
    banned: false,
  });
};

const Register = async (req, res) => {
  const { email, username, password, gender, profilePhoto, birthDate} =
    req.body;

  if (password) req.body.password = "[REDACTED]";

  

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ message: "username de usuario o password o email faltante" });
  }

  const Hashedpassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({
      email,
      username,
      gender,
      birthDate,
      password: Hashedpassword,
      idRole: 1,
      eliminated: 0,
      penaltyDate: "nada",
      description: "agregar descripcion",
      followerAmount: 0,
      followingAmount: 0,
      profilePhoto,
      banner: "vacio",
      friendId: 2,
      ubication: "Agregar ubicacion",
      DVH: "1234567890123456789012345678901234567890123456789012345678901234", // Por ahora no tenemos el cálculo para hacer los dígitos verificadores
    });
    return res.status(201).json(user)
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      // Extrae los mensajes de error específicos
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({
        message: 'Validación fallida',
        details: messages
      });
    } else if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Ya existe el email o usuario" });
    }
    console.log(error);
    return res.status(500).json({ message: "Hubo un error al ingresar el usuario" })
  }
}


const DeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await User.findByPk(id)

    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }
    res.status(200).json({
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar usuario",
      error: error.message,
    });
  }
}

const UpdateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const { username, description, profilePhoto, banner, ubication } = req.body;

    const dataUpdate = {};

    if (username !== undefined) dataUpdate.username = username;
    if (description !== undefined) dataUpdate.description = description;
    if (profilePhoto !== undefined) dataUpdate.profilePhoto = profilePhoto;
    if (banner !== undefined) dataUpdate.banner = banner;
    if (ubication !== undefined) dataUpdate.ubication = ubication;

    await user.update(dataUpdate);

    return res.status(200).json({
      message: "Usuario actualizado correctamente",
      user,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "El username de usuario ya existe",
      });
    }

    return res.status(500).json({
      message: "Error al actualizar usuario",
      error: error.message,
    });
  }
};

module.exports = {
  Login,
  Register,
  DeleteUser,
  UpdateUser,
  GetSession,
};
````

---

## `api/controllers/admin.js`

````js
const { Op } = require("sequelize");
const { User } = require("../models/User");
const Role = require("../models/Role");
const { getBanExpiration } = require("../services/banService");
const {
  emitToAccount,
  scheduleDisconnect,
  rememberBan,
  forgetBan,
} = require("../sockets/account");

const MAX_DURATION_MINUTES = 60 * 24 * 365; // 1 año

const normalizeDuration = (value) => {
  const minutes = Number(value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_DURATION_MINUTES) {
    return null;
  }
  return minutes;
};

const getRoleName = async (idRole) => {
  const role = await Role.findByPk(idRole);
  return role?.role || null;
};

const serializeUser = (user) => {
  const until = getBanExpiration(user);

  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    idRole: user.idRole,
    eliminated: Boolean(user.eliminated),
    banned: Boolean(until),
    bannedUntil: until ? until.toISOString() : null,
    banReason: until ? user.banReason || null : null,
  };
};

// GET /admin/users?q=... -> lista de usuarios con su estado de sanción
const listUsers = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const where = q
      ? {
          [Op.or]: [
            { username: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } },
          ],
        }
      : undefined;

    const users = await User.findAll({
      where,
      attributes: [
        "userId",
        "username",
        "email",
        "idRole",
        "eliminated",
        "bannedUntil",
        "banReason",
      ],
      order: [["username", "ASC"]],
      limit: 100,
    });

    return res.status(200).json({ users: users.map(serializeUser) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los usuarios" });
  }
};

// PATCH /admin/users/:id/ban { durationMinutes, reason? }
const banUser = async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const durationMinutes = normalizeDuration(req.body?.durationMinutes);
    const reason = String(req.body?.reason || "").trim().slice(0, 255) || null;

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ message: "Usuario inválido" });
    }

    if (!durationMinutes) {
      return res.status(400).json({
        message: "La duración debe ser un número entero de minutos entre 1 y 525600",
      });
    }

    const target = await User.findByPk(targetId);

    if (!target) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (Number(target.userId) === Number(req.user.userId)) {
      return res.status(400).json({ message: "No podés sancionar tu propia cuenta" });
    }

    if ((await getRoleName(target.idRole)) === "Admin") {
      return res.status(400).json({ message: "No se puede sancionar a un administrador" });
    }

    const bannedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    await target.update({ bannedUntil, banReason: reason });

    const payload = {
      code: "BANNED",
      message: `Tu cuenta está suspendida temporalmente hasta el ${bannedUntil.toLocaleString("es-AR")}.`,
      bannedUntil: bannedUntil.toISOString(),
      banReason: reason,
      durationMinutes,
    };

    // Aviso inmediato a todas las pestañas/dispositivos del usuario y cierre de
    // las conexiones activas: no puede seguir operando con la sesión abierta.
    rememberBan(target.userId, payload);
    emitToAccount(target.userId, "account:banned", payload);
    scheduleDisconnect(target.userId);

    return res.status(200).json({
      message: "Sanción aplicada",
      user: serializeUser(target),
      ban: payload,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al aplicar la sanción" });
  }
};

// DELETE /admin/users/:id/ban -> levanta la sanción antes de su vencimiento
const unbanUser = async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ message: "Usuario inválido" });
    }

    const target = await User.findByPk(targetId);

    if (!target) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await target.update({ bannedUntil: null, banReason: null });
    forgetBan(target.userId);
    emitToAccount(target.userId, "account:unbanned", {
      message: "La sanción de tu cuenta fue levantada",
    });

    return res.status(200).json({
      message: "Sanción levantada",
      user: serializeUser(target),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al levantar la sanción" });
  }
};

module.exports = {
  listUsers,
  banUser,
  unbanUser,
};
````

---

## `api/sockets/account.js`

````js
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
````

---

## `api/sockets/presence.js`

````js
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { buildBanPayload } = require("../services/banService");
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
  presenceNs.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.userId);

      if (!user) return next(new Error("No autorizado"));

      // Un usuario sancionado no puede conectarse a la presencia.
      if (buildBanPayload(user)) return next(new Error("account banned"));

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

module.exports = { setupPresence, isOnline, emitToUser };````

---

## `api/sockets/chat.js`

````js
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { buildBanPayload } = require("../services/banService");
const { isUserBanned } = require("./account");
const {
    createMessage,
    deleteMessage,
    revokeMessage,
    deleteMessageForUser,
    editMessage,
    toClientMessage,
    serializeMessages
} = require("../controllers/messages");

function setupChat(io) {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(payload.userId);

            if (!user) {
                return next(new Error("Usuario no encontrado"));
            }

            // Un usuario sancionado no puede abrir ni reconectar el chat.
            if (buildBanPayload(user) || isUserBanned(user.userId)) {
                return next(new Error("account banned"));
            }

            socket.userId = payload.userId;
            next();
        } catch (error) {
            next(new Error("Invalid token"));
        }
    });

    // La sanción puede aplicarse mientras el socket ya está conectado:
    // se verifica la caché antes de permitir cualquier acción.
    const ensureNotBanned = (socket) => {
        if (!isUserBanned(socket.userId)) return true;

        socket.emit("messageError", {
            code: "BANNED",
            message: "Tu cuenta está suspendida temporalmente."
        });
        socket.disconnect(true);
        return false;
    };

    io.on("connection", (socket) => {

        console.log(
            "User connected:",
            socket.userId, socket.id
        );
        socket.join(`user_${socket.userId}`);


        socket.on("sendMessage", async (data) => {
            if (!ensureNotBanned(socket)) return;

            try {
                const message = await createMessage({
                    ...data,
                    senderId: socket.userId
                });

                // Incluye la referencia liviana al mensaje original (replyTo) si es una respuesta
                const [payload] = await serializeMessages([message]);

                io.to(`user_${message.receiverId}`).emit("newMessage", payload);
                io.to(`user_${message.receiverId}`).emit("userTyping", {
                    senderId: socket.userId,
                    isTyping: false
                });
                socket.emit("messageSent", payload);
            } catch (error) {
                console.error(error);
                socket.emit("messageError", { message: error.message });
            }

        });


    
        socket.on(
            "deleteMessage",
            async ({ messageId }) => {
                if (!ensureNotBanned(socket)) return;

                try {

                    const message =
                        await deleteMessage(
                            messageId,
                            socket.userId
                        );

                    io.to(`user_${message.receiverId}`)
                        .to(`user_${message.senderId}`)
                        .emit("messageDeleted", { messageId });

                } catch (error) {

                    console.error(error);

                    socket.emit(
                        "messageError",
                        {
                            message: error.message
                        }
                    );
                }   
            }
        );


        // Anular envio para todos: no borra el registro, lo marca como anulado y avisa a ambos usuarios
        socket.on("revokeMessage", async (data) => {
            if (!ensureNotBanned(socket)) return;

            try {
                const message = await revokeMessage(data?.messageId, socket.userId);
                const [payload] = await serializeMessages([message]);

                // Se avisa a cada participante por separado: quien ya habia eliminado el mensaje
                // "para ti" recibe hiddenForViewer=true para que el mensaje NO reaparezca en su chat
                // (solo actualiza las respuestas que lo citan).
                io.to(`user_${message.senderId}`).emit("messageRevoked", {
                    ...payload,
                    hiddenForViewer: Boolean(message.deletedBySender)
                });
                if (Number(message.receiverId) !== Number(message.senderId)) {
                    io.to(`user_${message.receiverId}`).emit("messageRevoked", {
                        ...payload,
                        hiddenForViewer: Boolean(message.deletedByReceiver)
                    });
                }
            } catch (error) {
                console.error(error);
                socket.emit("messageError", { message: error.message });
            }

        });


        // Eliminar para ti: solo se oculta para el usuario que lo pidio (y sus otras pestañas)
        socket.on("deleteMessageForMe", async (data) => {
            if (!ensureNotBanned(socket)) return;

            try {
                await deleteMessageForUser(data?.messageId, socket.userId);

                io.to(`user_${socket.userId}`).emit("messageDeletedForMe", {
                    messageId: data.messageId
                });
            } catch (error) {
                console.error(error);
                socket.emit("messageError", { message: error.message });
            }

        });


        // Editar mensaje: actualiza el registro existente y avisa a ambos usuarios
        socket.on("editMessage", async (data) => {
            if (!ensureNotBanned(socket)) return;

            try {
                const message = await editMessage(data?.messageId, socket.userId, data?.content);
                const [payload] = await serializeMessages([message]);

                // No se envia a quien elimino el mensaje "para ti"
                if (!message.deletedBySender) {
                    io.to(`user_${message.senderId}`).emit("messageEdited", payload);
                }
                if (!message.deletedByReceiver && Number(message.receiverId) !== Number(message.senderId)) {
                    io.to(`user_${message.receiverId}`).emit("messageEdited", payload);
                }
            } catch (error) {
                console.error(error);
                socket.emit("messageError", { message: error.message });
            }

        });


        // Indicador de escritura en tiempo real: retransmite al destinatario
        socket.on("typing", (data) => {
            const receiverId = Number(data?.receiverId);
            if (!receiverId || receiverId === Number(socket.userId)) return;
            io.to(`user_${receiverId}`).emit("userTyping", {
                senderId: socket.userId,
                isTyping: true
            });
        });

        socket.on("stopTyping", (data) => {
            const receiverId = Number(data?.receiverId);
            if (!receiverId || receiverId === Number(socket.userId)) return;
            io.to(`user_${receiverId}`).emit("userTyping", {
                senderId: socket.userId,
                isTyping: false
            });
        });


        socket.on("disconnect", () => {

            console.log(
                "User disconnected:",
                socket.id, socket.userId
            );

        });

    });

}


module.exports = setupChat;
````

---

## `api/index.js`

````js
require('dotenv').config()
const express = require('express')
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const upload = require("./middlewares/upload");
const uploadPostMedia = require("./middlewares/uploadPostMedia");
const auditLog = require("./middlewares/auditLog");
const {uploadFile} = require("./controllers/uploads");
const { Login, Register, DeleteUser, UpdateUser, GetSession } = require('./controllers/users')
const { listUsers, banUser, unbanUser } = require('./controllers/admin')
const {createPost, deletePost, updatePost, getPosts, getPostById, getReplies, toggleLike} = require('./controllers/posts')
const {createRole} = require('./controllers/roles')
const {SendVerificationCode, CheckVerificationCode} = require('./controllers/verify')
const { checkToken, checkAdmin } = require('./middlewares/auth')
const {getMessages, getConversations, deleteConversationForUser, getUserById, markAsRead, searchUsers} = require('./controllers/messages')
const {createProduct, deleteProduct, updateProduct} = require('./controllers/products')
const setupChat = require("./sockets/chat");
const { setupPresence } = require("./sockets/presence");
const { setupAccount } = require("./sockets/account");
const {
  getFriends, getFriendRequests, searchPeople,
  sendFriendRequest, acceptFriendRequest, removeFriendship
} = require("./controllers/friends");
const {
  getNotifications, markNotificationsRead, deleteNotification, clearNotifications
} = require("./controllers/notifications");
const sequelize = require('./config/db')
const { ensureMessagesColumns, ensureUsersColumns } = require('./config/migrations')
const connectDB = require("./config/dbnosql")
const server = express()

const httpServer = http.createServer(server);

const PORT = 3000
const CLIENT_URL = "http://localhost:5173";

server.use(express.json({ limit: '10mb' }))

server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CLIENT_URL)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Bitácora (logs/bitacora.txt): registra toda interacción que no sea GET
server.use(auditLog)

const io = new Server(httpServer, {
  cors: {
      origin: CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true
  }
});

server.post('/CreateRole', createRole);

server.post('/login', Login);
server.post('/register', Register);
server.get('/session', checkToken, GetSession);
server.patch('/deleteUser/:id',checkToken, DeleteUser);
server.patch('/updateUser/:id',checkToken, UpdateUser);

// Administración: listado, sanción temporal y levantamiento de sanción
server.get('/admin/users', checkToken, checkAdmin, listUsers);
server.patch('/admin/users/:id/ban', checkToken, checkAdmin, banUser);
server.delete('/admin/users/:id/ban', checkToken, checkAdmin, unbanUser);

server.post('/CreatePost', checkToken, uploadPostMedia, createPost);
server.patch('/DeletePost/:id',checkToken, deletePost);
server.patch('/UpdatePost/:id',checkToken, uploadPostMedia, updatePost);
server.get('/GetPost', checkToken, getPosts);
server.get('/GetPost/:id', checkToken, getPostById);
server.get('/GetReplies/:id', checkToken, getReplies);
server.post('/LikePost/:id', checkToken, toggleLike); 

server.post('/CreateProduct', checkToken, createProduct);
server.patch('/DeleteProduct/:id',checkToken, deleteProduct);
server.patch('/UpdateProduct/:id',checkToken, updateProduct); 

server.post('/verify/send', SendVerificationCode);
server.post('/verify/check', CheckVerificationCode);

server.get("/messages/:otherUserId", checkToken, getMessages);

server.get("/conversations", checkToken, getConversations);
server.get("/users/search", checkToken, searchUsers);
server.get("/users/:id", checkToken, getUserById);
server.put("/messages/read/:otherUserId", checkToken, markAsRead);
server.delete("/conversations/:otherUserId", checkToken, deleteConversationForUser);

server.get("/friends", checkToken, getFriends);
server.get("/friends/requests", checkToken, getFriendRequests);
server.get("/friends/search", checkToken, searchPeople);
server.post("/friends/request/:userId", checkToken, sendFriendRequest);
server.patch("/friends/accept/:userId", checkToken, acceptFriendRequest);
server.delete("/friends/:userId", checkToken, removeFriendship);

server.get("/notifications", checkToken, getNotifications);
server.patch("/notifications/read", checkToken, markNotificationsRead);
server.delete("/notifications/:id", checkToken, deleteNotification);
server.delete("/notifications", checkToken, clearNotifications);

server.post("/Upload", checkToken, upload.single("file"), uploadFile);
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Permite que los controladores HTTP (por ejemplo markAsRead) emitan eventos por socket
server.set("io", io);

setupChat(io);
setupPresence(io);
setupAccount(io);

const start = async () => {
  await sequelize.sync();
  await ensureMessagesColumns();
  await ensureUsersColumns();
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();````

---

## `fronten/lost-in-music/src/services/session.js`

````js
import { API_URL } from "./http";

export const SESSION_STORAGE_KEYS = ["token", "user", "idRole"];

export function getToken() {
  return localStorage.getItem("token");
}

export function clearSession() {
  SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

// GET /session: valida el token y devuelve el estado de la cuenta.
// Si está sancionada, el backend responde 403 { code: "BANNED", bannedUntil, ... }.
export async function fetchSession() {
  const token = getToken();

  if (!token) {
    return { ok: false, status: 401, data: null };
  }

  try {
    const response = await fetch(`${API_URL}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      // respuesta sin cuerpo JSON
    }

    return { ok: response.ok, status: response.status, data };
  } catch {
    // Sin conexión: no se cierra la sesión por un fallo de red.
    return { ok: false, status: 0, data: null, networkError: true };
  }
}
````

---

## `fronten/lost-in-music/src/services/accountSocket.js`

````js
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
````

---

## `fronten/lost-in-music/src/services/adminApi.js`

````js
import { request } from "./http";

export const getAdminUsers = (query = "") =>
  request(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);

export const banUser = (userId, durationMinutes, reason = "") =>
  request(`/admin/users/${userId}/ban`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ durationMinutes, reason }),
  });

export const unbanUser = (userId) =>
  request(`/admin/users/${userId}/ban`, { method: "DELETE" });
````

---

## `fronten/lost-in-music/src/hooks/sessionContext.js`

````js
import { createContext, useContext } from "react";

// Datos de la cuenta validada (userId, username, idRole, ...).
const SessionContext = createContext(null);

export const useSession = () => useContext(SessionContext);

export default SessionContext;
````

---

## `fronten/lost-in-music/src/components/BanModal.jsx`

````jsx
import { useEffect, useState } from "react";
import "../styles/BanModal.css";

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRemaining = (ms) => {
  if (ms <= 0) return null;

  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days} ${days === 1 ? "día" : "días"}`);
  if (hours) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  if (minutes || !parts.length) {
    parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
  }

  return parts.join(" y ");
};

/**
 * Ventana emergente que se muestra en cualquier sección de la aplicación
 * cuando el backend informa que la cuenta fue suspendida temporalmente.
 */
export default function BanModal({ ban, onClose }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const untilDate = ban?.bannedUntil ? formatDate(ban.bannedUntil) : null;
  const remaining = ban?.bannedUntil
    ? formatRemaining(new Date(ban.bannedUntil).getTime() - now)
    : null;

  return (
    <div className="ban-overlay">
      <div
        className="ban-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ban-title"
        aria-describedby="ban-description"
      >
        <div className="ban-icon" aria-hidden="true">
          ⏳
        </div>

        <h2 id="ban-title" className="ban-title">
          Cuenta suspendida temporalmente
        </h2>

        <p id="ban-description" className="ban-text">
          Un administrador suspendió tu cuenta. No vas a poder iniciar sesión ni
          usar la red social hasta que la sanción termine.
        </p>

        {untilDate && (
          <div className="ban-detail">
            <span className="ban-detail-label">Duración de la sanción</span>
            <strong className="ban-detail-value">
              Hasta el {untilDate} hs
            </strong>
            {remaining && (
              <span className="ban-remaining">
                Tiempo restante: {remaining}
              </span>
            )}
          </div>
        )}

        {ban?.banReason && (
          <p className="ban-reason">
            <strong>Motivo:</strong> {ban.banReason}
          </p>
        )}

        <button type="button" className="ban-button" onClick={onClose}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
````

---

## `fronten/lost-in-music/src/components/SessionGuard.jsx`

````jsx
import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { clearSession, fetchSession } from "../services/session";
import {
  disconnectAccountSocket,
  getAccountSocket,
} from "../services/accountSocket";
import { disconnectSocket } from "../services/socket";
import BanModal from "./BanModal";
import SessionContext from "../hooks/sessionContext";

const STATUS = {
  CHECKING: "checking",
  OK: "ok",
  BANNED: "banned",
  UNAUTHENTICATED: "unauthenticated",
};

/**
 * Protege todas las rutas privadas de la aplicación:
 *  - sin token         -> redirige a /acceso (incluye URLs escritas a mano)
 *  - cuenta sancionada -> muestra la ventana emergente en cualquier sección
 *  - sesión válida     -> renderiza la app
 *
 * Además mantiene una conexión /account para enterarse del baneo al instante,
 * sin esperar a que el usuario recargue la página.
 */
export default function SessionGuard({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATUS.CHECKING);
  const [user, setUser] = useState(null);
  const [ban, setBan] = useState(null);

  const applySessionResult = useCallback((result) => {
    if (result.ok) {
      setUser(result.data?.user || null);
      setBan(null);
      setStatus(STATUS.OK);
      return;
    }

    if (result.status === 403 && result.data?.code === "BANNED") {
      setBan({
        bannedUntil: result.data.bannedUntil || null,
        banReason: result.data.banReason || null,
      });
      setStatus(STATUS.BANNED);
      return;
    }

    if (result.status === 401 || result.status === 404) {
      clearSession();
      setUser(null);
      setStatus(STATUS.UNAUTHENTICATED);
      return;
    }

    // Error de red o del servidor: la sesión no se invalida. El backend sigue
    // siendo la autoridad y bloqueará cualquier petición si corresponde.
    setStatus((previous) =>
      previous === STATUS.CHECKING ? STATUS.OK : previous
    );
  }, []);

  const verify = useCallback(async () => {
    const result = await fetchSession();
    applySessionResult(result);
  }, [applySessionResult]);

  // Validación inicial de la sesión (la app no se muestra hasta confirmarla).
  useEffect(() => {
    let active = true;

    fetchSession().then((result) => {
      if (active) applySessionResult(result);
    });

    return () => {
      active = false;
    };
  }, [applySessionResult]);

  // Aviso en tiempo real: se recibe aunque el usuario esté en cualquier sección.
  useEffect(() => {
    if (status !== STATUS.OK) return undefined;

    const socket = getAccountSocket();
    if (!socket) return undefined;

    const handleBanned = (payload) => {
      setBan({
        bannedUntil: payload?.bannedUntil || null,
        banReason: payload?.banReason || null,
      });
      setStatus(STATUS.BANNED);
      // El servidor ya rechaza cualquier reconexión mientras dure la sanción.
      disconnectAccountSocket();
    };

    const handleUnbanned = () => {
      setBan(null);
      setStatus(STATUS.CHECKING);
      verify();
    };

    socket.on("account:banned", handleBanned);
    socket.on("account:unbanned", handleUnbanned);

    return () => {
      socket.off("account:banned", handleBanned);
      socket.off("account:unbanned", handleUnbanned);
    };
  }, [status, verify]);

  // Revalidación periódica: cubre caídas del socket y el vencimiento del baneo.
  useEffect(() => {
    if (status !== STATUS.OK && status !== STATUS.BANNED) return undefined;

    const intervalMs = status === STATUS.BANNED ? 30000 : 60000;

    const check = () => {
      if (document.visibilityState === "hidden") return;
      verify();
    };

    const timer = setInterval(check, intervalMs);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [status, verify]);

  const handleBanClose = useCallback(() => {
    disconnectAccountSocket();
    disconnectSocket();
    clearSession();
    setUser(null);
    setBan(null);
    setStatus(STATUS.UNAUTHENTICATED);
    navigate("/acceso", { replace: true });
  }, [navigate]);

  if (status === STATUS.CHECKING) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: "#4c6a80",
          background: "#eaf4fb",
        }}
      >
        Verificando sesión…
      </div>
    );
  }

  if (status === STATUS.UNAUTHENTICATED) {
    return <Navigate to="/acceso" replace />;
  }

  if (status === STATUS.BANNED) {
    return <BanModal ban={ban} onClose={handleBanClose} />;
  }

  return (
    <SessionContext.Provider value={{ user }}>
      {children}
    </SessionContext.Provider>
  );
}
````

---

## `fronten/lost-in-music/src/styles/BanModal.css`

````css
.ban-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(12, 24, 36, 0.78);
  backdrop-filter: blur(6px);
}

.ban-card {
  width: 100%;
  max-width: 460px;
  padding: 30px 28px 26px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #eef6fd 100%);
  border: 1px solid rgba(122, 184, 216, 0.55);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
  text-align: center;
  color: #1b2733;
  animation: ban-card-in 0.25s ease-out;
}

@keyframes ban-card-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ban-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  border-radius: 50%;
  background: #fdecea;
  border: 2px solid #f3b7b2;
}

.ban-title {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 800;
  color: #b23a2f;
}

.ban-text {
  margin: 0 0 18px;
  font-size: 15px;
  line-height: 1.5;
  color: #3f4d5b;
}

.ban-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f3f8fc;
  border: 1px solid #d7e6f2;
}

.ban-detail-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5a7d96;
}

.ban-detail-value {
  font-size: 16px;
  color: #1d5b86;
}

.ban-remaining {
  font-size: 14px;
  color: #b23a2f;
  font-weight: 600;
}

.ban-reason {
  margin: 0 0 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff6e5;
  border: 1px solid #f1d9a8;
  font-size: 14px;
  color: #6b5124;
  text-align: left;
  word-break: break-word;
}

.ban-button {
  width: 100%;
  padding: 13px 18px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(180deg, #5aa9d8 0%, #2f7fb5 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.ban-button:hover {
  filter: brightness(1.07);
}

.ban-button:active {
  transform: translateY(1px);
}

.ban-button:focus-visible {
  outline: 3px solid rgba(90, 169, 216, 0.5);
  outline-offset: 2px;
}
````

---

## `fronten/lost-in-music/src/pages/admin.jsx`

````jsx
import { useCallback, useEffect, useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { useSession } from "../hooks/sessionContext";
import { banUser, getAdminUsers, unbanUser } from "../services/adminApi";
import "../styles/admin.css";

const DURATIONS = [
  { value: 15, label: "15 minutos" },
  { value: 60, label: "1 hora" },
  { value: 360, label: "6 horas" },
  { value: 1440, label: "24 horas" },
  { value: 10080, label: "7 días" },
  { value: 43200, label: "30 días" },
];

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function BanDialog({ user, onClose, onDone }) {
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await banUser(user.userId, Number(durationMinutes), reason.trim());
      onDone();
    } catch (err) {
      setError(err.message || "No se pudo aplicar la sanción");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-dialog-overlay">
      <form
        className="admin-dialog"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
      >
        <h3 id="admin-dialog-title">Sancionar a @{user.username}</h3>

        <label className="admin-field">
          <span>Duración de la suspensión</span>
          <select
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
          >
            {DURATIONS.map((duration) => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span>Motivo (opcional)</span>
          <input
            type="text"
            maxLength={255}
            value={reason}
            placeholder="Ej.: incumplimiento de las normas"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-dialog-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn--danger"
            disabled={submitting}
          >
            {submitting ? "Aplicando…" : "Aplicar sanción"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const session = useSession();
  const isAdmin = Number(session?.user?.idRole) === 2;

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banTarget, setBanTarget] = useState(null);
  const [actionId, setActionId] = useState(null);

  const loadUsers = useCallback(async (search) => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminUsers(search);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const timer = setTimeout(() => loadUsers(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [isAdmin, query, loadUsers]);

  const handleUnban = async (user) => {
    setActionId(user.userId);
    setError("");

    try {
      await unbanUser(user.userId);
      await loadUsers(query.trim());
    } catch (err) {
      setError(err.message || "No se pudo levantar la sanción");
    } finally {
      setActionId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <Header />
        <main className="admin-main">
          <section className="admin-card admin-card--notice">
            <h1>Acceso restringido</h1>
            <p>Esta sección es exclusiva de los administradores.</p>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Header />

      <main className="admin-main">
        <section className="admin-card">
          <div className="admin-header">
            <div>
              <h1>Administración de usuarios</h1>
              <p className="admin-subtitle">
                Aplicá una suspensión temporal. El usuario será notificado al
                instante y no podrá usar la plataforma hasta que termine.
              </p>
            </div>

            <input
              type="search"
              className="admin-search"
              placeholder="Buscar por usuario o email…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {error && <p className="admin-error">{error}</p>}

          {loading ? (
            <p className="admin-status">Cargando usuarios…</p>
          ) : users.length === 0 ? (
            <p className="admin-status">No se encontraron usuarios.</p>
          ) : (
            <ul className="admin-list">
              {users.map((user) => (
                <li key={user.userId} className="admin-user">
                  <div className="admin-user-info">
                    <strong>@{user.username}</strong>
                    <span className="admin-user-email">{user.email}</span>
                    <span className="admin-user-role">
                      {Number(user.idRole) === 2 ? "Administrador" : "Usuario"}
                    </span>
                  </div>

                  <div className="admin-user-state">
                    {user.banned ? (
                      <span className="admin-badge admin-badge--banned">
                        Suspendido hasta {formatDate(user.bannedUntil)}
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge--active">
                        Activo
                      </span>
                    )}
                  </div>

                  <div className="admin-user-actions">
                    {user.banned ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        disabled={actionId === user.userId}
                        onClick={() => handleUnban(user)}
                      >
                        {actionId === user.userId
                          ? "Quitando…"
                          : "Quitar sanción"}
                      </button>
                    ) : Number(user.idRole) === 2 ? (
                      <span className="admin-muted">—</span>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => setBanTarget(user)}
                      >
                        Banear
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />

      {banTarget && (
        <BanDialog
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onDone={async () => {
            setBanTarget(null);
            await loadUsers(query.trim());
          }}
        />
      )}
    </div>
  );
}
````

---

## `fronten/lost-in-music/src/styles/admin.css`

````css
.admin-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eaf4fb;
}

.admin-main {
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.admin-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #d7e6f2;
  box-shadow: 0 10px 30px rgba(31, 78, 110, 0.08);
  padding: 24px;
}

.admin-card--notice {
  text-align: center;
  margin-top: 40px;
  color: #3f4d5b;
}

.admin-card--notice h1 {
  margin-top: 0;
  color: #b23a2f;
}

.admin-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.admin-header h1 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #1b2733;
}

.admin-subtitle {
  margin: 0;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.45;
  color: #5b6b79;
}

.admin-search {
  min-width: 240px;
  flex: 0 1 280px;
  padding: 10px 12px;
  border: 1px solid #c8dbe9;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  color: #1b2733;
}

.admin-search:focus {
  border-color: #5aa9d8;
  box-shadow: 0 0 0 3px rgba(90, 169, 216, 0.18);
}

.admin-status {
  padding: 22px 0;
  text-align: center;
  color: #5b6b79;
  font-size: 14px;
}

.admin-error {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 9px;
  background: #fdecea;
  border: 1px solid #f3b7b2;
  color: #a53227;
  font-size: 14px;
}

.admin-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-user {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 11px;
  border: 1px solid #e3eef6;
  background: #f9fcfe;
}

.admin-user-info {
  flex: 1 1 220px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-user-info strong {
  font-size: 15px;
  color: #1b2733;
  word-break: break-word;
}

.admin-user-email {
  font-size: 13px;
  color: #5b6b79;
  word-break: break-word;
}

.admin-user-role {
  font-size: 12px;
  font-weight: 700;
  color: #2f7fb5;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.admin-user-state {
  flex: 0 1 auto;
}

.admin-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.admin-badge--active {
  background: #e7f7ee;
  color: #1f7a4d;
}

.admin-badge--banned {
  background: #fdecea;
  color: #a53227;
}

.admin-user-actions {
  flex: 0 0 auto;
}

.admin-muted {
  color: #9aa8b4;
}

.admin-btn {
  border: none;
  border-radius: 9px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.admin-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.admin-btn--danger {
  background: #c0392b;
  color: #fff;
}

.admin-btn--ghost {
  background: #eef4f9;
  color: #2f5c79;
  border: 1px solid #c8dbe9;
}

.admin-btn:hover:not(:disabled) {
  filter: brightness(0.96);
}

/* Modal de sanción */
.admin-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(12, 24, 36, 0.6);
  backdrop-filter: blur(4px);
}

.admin-dialog {
  width: 100%;
  max-width: 420px;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.admin-dialog h3 {
  margin: 0 0 18px;
  font-size: 18px;
  color: #1b2733;
}

.admin-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #3f4d5b;
}

.admin-field select,
.admin-field input {
  padding: 10px 12px;
  border: 1px solid #c8dbe9;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 400;
  color: #1b2733;
  outline: none;
}

.admin-field select:focus,
.admin-field input:focus {
  border-color: #5aa9d8;
  box-shadow: 0 0 0 3px rgba(90, 169, 216, 0.18);
}

.admin-dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 560px) {
  .admin-user-actions,
  .admin-user-state {
    flex: 1 1 100%;
  }

  .admin-dialog-actions {
    flex-direction: column-reverse;
  }
}
````

---

## `fronten/lost-in-music/src/components/login.jsx`

````jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, fetchSession } from "../services/session";
import "../styles/login.css";

function Login({ goToRegister, goToResetPassword }) {
  const navigate = useNavigate();

  const [emailUser, setEmailUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    // Solo se redirige si la sesión guardada sigue siendo válida. Si la cuenta
    // está sancionada (403 BANNED), se queda en el login y el backend informa
    // el motivo y la duración al intentar ingresar.
    const checkStoredSession = async () => {
      if (!localStorage.getItem("token")) return;

      const result = await fetchSession();
      if (cancelled) return;

      if (result.ok) {
        window.location.href = "/feed";
      } else if (result.status === 401 || result.status === 404) {
        clearSession();
      }
    };

    checkStoredSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ emailUser: true, password: true });
    if (errors.emailUser || errors.password) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: emailUser, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data.message || "Credenciales inválidas");
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.idRole) localStorage.setItem("idRole", data.idRole);
      navigate("/feed", { replace: true });
    } catch {
      setSubmitError("No se pudo conectar con el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlur = (name) => {
    setTouched((p) => ({ ...p, [name]: true }));
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    goToResetPassword();
  };

  const handleRegister = (e) => {
    e.preventDefault();
    goToRegister();
  };

  const errors = {
    emailUser: emailUser.trim() === "",
    password: password.trim() === "",
  };

  return (
    <div className="login-card">
      <div className="login-shine"></div>

      <div className="login-inner">
        <div className="login-logo">
          <img
            src="/logoo.png"
            alt="Logo Lost In Music"
            className="login-logo-img"
          />
        </div>

        <h1 className="login-logo-title">Lost In Music</h1>

        <div className="login-welcome">Tu red social musical</div>

        <h2 className="login-section-title">Inicia Sesión</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label className="login-label">Correo electrónico o Usuario</label>

            <div style={{ position: "relative" }}>
              <input
                type="text"
                className={`login-input ${
                  touched.emailUser && errors.emailUser ? "input-error" : ""
                }`}
                onBlur={() => handleBlur("emailUser")}
                placeholder="tu@email.com"
                value={emailUser}
                onChange={(e) => setEmailUser(e.target.value)}
              />

              {touched.emailUser && errors.emailUser && (
                <span className="login-status-icon login-input-cross">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#f06060" />
                    <path
                      d="M8 8l8 8M16 8l-8 8"
                      stroke="#fff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}
            </div>

            {touched.emailUser && errors.emailUser && (
              <div className="login-error-text">
                Ingresa tu correo o usuario
              </div>
            )}

            <div className="login-hint-text">
              Usá tu email o nombre de usuario.
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-label">Contraseña</label>

            <div className="login-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className={`login-input login-password-input ${touched.password && errors.password ? "input-error" : ""}`}
                onBlur={() => handleBlur("password")}
                placeholder="Escribe tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {touched.password && errors.password && (
                <span className="login-status-icon login-input-cross password-error-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#f06060" />
                    <path
                      d="M8 8l8 8M16 8l-8 8"
                      stroke="#fff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}
              {password && (
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                        stroke="#7ab8d8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="#7ab8d8"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
                        stroke="#7ab8d8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
                        stroke="#7ab8d8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="1"
                        y1="1"
                        x2="23"
                        y2="23"
                        stroke="#7ab8d8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {touched.password && errors.password && (
              <div className="login-error-text-pass">
                Ingresa tu contraseña
              </div>
            )}
          </div>
          <div className="login-hint-text">Escribe tu contraseña</div>

          <div className="login-forgot-link">
            <a href="#" onClick={handleForgotPassword} className="login-link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? "Ingresando…" : "Iniciar Sesión"}
          </button>

          {submitError && (
            <div
              className="login-error-text"
              style={{ textAlign: "center", marginTop: 10 }}
            >
              {submitError}
            </div>
          )}
        </form>

        <div className="login-register-link">
          <span>¿No tenes cuenta? </span>

          <a href="#" onClick={handleRegister} className="login-link">
            Registrate
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
````

---

## `fronten/lost-in-music/src/components/header.jsx`

````jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import LangSelector from './LangSelector';
import NotificationsMenu from './NotificationsMenu';
import { useSession } from '../hooks/sessionContext';
import { clearSession } from '../services/session';
import { disconnectAccountSocket } from '../services/accountSocket';
import { disconnectSocket } from '../services/socket';

function Header() {
  const navigate = useNavigate();
  const session = useSession();
  const isAdmin = Number(session?.user?.idRole) === 2;
  const [menuOpen, setMenuOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  
  // Estados para la búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  // Cargar datos del usuario logueado
  useEffect(() => {
    const storedUser = localStorage.getItem('user'); 
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.profilePhoto) {
          setUserPhoto(parsedUser.profilePhoto);
        }
      } catch (e) {
        console.error("Error al parsear el usuario", e);
      }
    }
  }, []);

  // Cerrar menús al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de búsqueda con Debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        
        // Llamada a tu backend
        const res = await fetch(`http://localhost:3000/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Error buscando usuarios:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Al hacer clic en un usuario, vamos a su perfil (o al chat)
  const handleUserClick = (userId) => {
    setShowResults(false);
    setSearchQuery('');
    // Ajusta esta ruta dependiendo de cómo tengas configurado tu React Router
    navigate(`/perfil/${userId}`); 
  };

  const handleLogout = () => {
    disconnectSocket();
    disconnectAccountSocket();
    clearSession();
    navigate('/acceso');
  };

  return (
    <header className="header-container">
      
      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="header-searchbar" ref={searchRef} style={{ position: 'relative' }}>
        <span>🔍</span>
        <input 
          type="text" 
          placeholder="Buscar usuarios..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { if(searchResults.length > 0) setShowResults(true) }}
          style={{ 
            border: 'none', background: 'transparent', outline: 'none', 
            width: '100%', marginLeft: '8px', color: 'inherit'
          }}
        />
        
        {/* DROPDOWN DE RESULTADOS */}
        {showResults && (
          <div style={{
            position: 'absolute', top: '120%', left: 0, right: 0,
            background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px', overflowY: 'auto', zIndex: 1000, color: 'black'
          }}>
            {isSearching ? (
              <div style={{ padding: '12px', color: '#888' }}>Buscando...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(user => (
                <div 
                  key={user.userId} 
                  onClick={() => handleUserClick(user.userId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>@{user.username}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>No se encontraron usuarios</div>
            )}
          </div>
        )}
      </div>

      {/* --- RESTO DEL HEADER (ICONOS Y PERFIL) --- */}
      <div className="header-icons">
        <LangSelector />
        
        <NotificationsMenu />

        <div className="header-profile-wrapper" ref={menuRef} style={{ position: 'relative' }}>
          <button 
            className="header-icon-btn profile-avatar-btn" 
            title="Perfil"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {userPhoto ? (
              <img 
                src={userPhoto} 
                alt="Perfil" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
              />
            ) : (
              '👤'
            )}
          </button>

          {menuOpen && (
            <div className="profile-dropdown-card" style={{
              position: 'absolute', right: 0, top: '110%', background: 'white',
              boxShadow: '0px 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px',
              padding: '8px', zIndex: 1000, minWidth: '140px'
            }}>
              {isAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/admin');
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', border: 'none',
                    background: 'transparent', textAlign: 'left', cursor: 'pointer',
                    color: '#2f5c79', fontWeight: 'bold', borderRadius: '4px'
                  }}
                >
                  🛡️ Administración
                </button>
              )}
              <button 
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  background: 'transparent', textAlign: 'left', cursor: 'pointer',
                  color: '#d9534f', fontWeight: 'bold', borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          )}
        </div>

        <button className="header-icon-btn" title="Configuración">
          ⚙️
        </button>
      </div>
    </header>
  );
}

export default Header;````

---

## `fronten/lost-in-music/src/App.jsx`

````jsx
import React, { useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";

import "./styles/App.css";
import "./styles/aero.css";

import Register from "./components/register";
import Navbar from "./components/shopinvivo/Navbar";
import AeroSidebar from "./components/shopinvivo/Sidebar";
import ProductGrid from "./components/shopinvivo/ProductGrid";
import RightSidebar from "./components/shopinvivo/RightSidebar";

import Header from "./components/header";
import LeftNav from "./components/leftNav";
import SocialSidebar from "./components/sidebar";
import Feed from "./pages/feed";
import Footer from "./components/footer";
import PhotoPage from "./pages/PhotoPage";
import CommentPage from "./pages/CommentPage";
import PostPage from "./pages/PostPage";
import Configuracion from "./pages/settings";
import PostModal from "./components/PostModal";
import { usePosts } from "./hooks/UsePosts";
import { LangProvider } from "./components/LangContext";
import { FriendsProvider } from "./components/FriendsContext";
import FriendsPage from "./pages/FriendsPage";
import MessagesPage from "./pages/messages/MessagesPage";
import AdminPage from "./pages/admin";
import SessionGuard from "./components/SessionGuard";

function Marketplace() {
  return (
    <div className="aero-root">
      <div className="frame">
        <Navbar />
        <div className="body-grid">
          <AeroSidebar />
          <ProductGrid />
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

function FeedPage({
  rootPosts,
  addPost,
  toggleLike,
  openPost,
  getReplies,
  addComment,
  openedPost,
  closePost,
  deletePost,
  editPost,
  now,
}) {
  const styles = {
    app: {
      width: "100%",
      height: "100vh",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      overflow: "hidden",
    },
    skyBg: {
      position: "fixed",
      inset: 0,
      zIndex: 0,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.30), rgba(255,255,255,0.20)),
        url('/backgroundFeed.jpg')
      `,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    },
    body: {
      position: "relative",
      zIndex: 10,
      height: "100vh",
      display: "grid",
      gridTemplateRows: "auto minmax(0, 1fr) auto",
      overflow: "hidden",
    },
    main: {
      display: "grid",
      gridTemplateColumns: "230px minmax(0, 1fr) 280px",
      minHeight: 0,
      overflow: "hidden",
    },
    feedWrapper: {
      minHeight: 0,
      overflowY: "scroll",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "18px",
    },
  };

  return (
    <div style={styles.app}>
      <div style={styles.skyBg} />

      <div style={styles.body}>
        <Header />

        <div style={styles.main}>
          <LeftNav />

          <div style={styles.feedWrapper} className="feed-scroll">
            <Feed
              posts={rootPosts}
              onPost={addPost}
              onLike={toggleLike}
              onOpenPost={openPost}
              onDelete={deletePost}
              onEdit={editPost}
              now={now}
            />
          </div>

          <SocialSidebar />
        </div>

        <Footer />
      </div>

      <PostModal
        post={openedPost}
        onClose={closePost}
        getReplies={getReplies}
        onComment={addComment}
        onLike={toggleLike}
        now={now}
      />
    </div>
  );
}

export default function App() {
  const {
    rootPosts,
    addPost,
    addComment,
    toggleLike,
    getPost,
    getReplies,
    deletePost,
    editPost,
  } = usePosts();

  const [openPostId, setOpenPostId] = useState(null);
  const [now, setNow] = useState(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const openPost = useCallback((id) => setOpenPostId(id), []);
  const closePost = useCallback(() => setOpenPostId(null), []);
  const openedPost = openPostId ? getPost(openPostId) : null;

  return (
    <LangProvider>
      <SessionGuard>
        <FriendsProvider>
          <Routes>
          <Route
            path="/"
            element={
              <FeedPage
                rootPosts={rootPosts}
                addPost={addPost}
                toggleLike={toggleLike}
                openPost={openPost}
                getReplies={getReplies}
                addComment={addComment}
                openedPost={openedPost}
                closePost={closePost}
                deletePost={deletePost}
                editPost={editPost}
                now={now}
              />
            }
          />

          <Route
            path="/feed"
            element={
              <FeedPage
                rootPosts={rootPosts}
                addPost={addPost}
                toggleLike={toggleLike}
                openPost={openPost}
                getReplies={getReplies}
                addComment={addComment}
                openedPost={openedPost}
                closePost={closePost}
                deletePost={deletePost}
                editPost={editPost}
                now={now}
              />
            }
          />

          {/* Registro y Shopinvivo */}
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<Marketplace />} />

          {/* Mensajería */}
          <Route path="/messages" element={<MessagesPage />} />

          {/* Resto de la red social */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/amigos" element={<FriendsPage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/settings" element={<Configuracion />} />

          <Route
            path="/photo/:postId/:imageIndex"
            element={
              <PhotoPage
                posts={rootPosts}
                getReplies={getReplies}
                onComment={addComment}
                onLike={toggleLike}
              />
            }
          />

          <Route
            path="/comment/:id"
            element={
              <CommentPage
                getPost={getPost}
                getReplies={getReplies}
                onComment={addComment}
                onLike={toggleLike}
              />
            }
          />
          </Routes>
        </FriendsProvider>
      </SessionGuard>
    </LangProvider>
  );
}
````

---

