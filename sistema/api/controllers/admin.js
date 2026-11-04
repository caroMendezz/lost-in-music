
const { Op } = require("sequelize");
const { User } = require("../models/User");
const Role = require("../models/Role");
const Post = require("../models/Post");

const { removeNotifications } = require("../services/notificationsService");
const { getFriendIds } = require("../services/friendsService");
const { getBanExpiration } = require("../services/banService");

const {
  emitToAccount,
  scheduleDisconnect,
  rememberBan,
  forgetBan,
} = require("../sockets/account");

// =====================================================
// CONFIGURACIÓN DE DURACIONES
// =====================================================

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const MAX_DURATION_MINUTES = 60 * 24 * 365;

const DURATIONS = {
  "1h": HOUR,
  "6h": 6 * HOUR,
  "24h": DAY,
  "7d": 7 * DAY,
  "30d": 30 * DAY,
};

const PERMANENT_DATE = "9999-12-31T23:59:59.999Z";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Normalizar duración personalizada.
const normalizeDuration = (value) => {
  const minutes = Number(value);

  if (
    !Number.isInteger(minutes) ||
    minutes < 1 ||
    minutes > MAX_DURATION_MINUTES
  ) {
    return null;
  }

  return minutes;
};

// Obtener nombre del rol.
const getRoleName = async (idRole) => {
  const role = await Role.findByPk(idRole);
  return role?.role || null;
};

// Comprobar si el usuario es administrador.
const isAdminUser = async (user) => {
  if (Number(user.idRole) === 2) {
    return true;
  }

  return (await getRoleName(user.idRole)) === "Admin";
};

// Obtener información de un usuario.
const serializeUser = (user) => {
  const until =
    getBanExpiration(user) ||
    (user.penaltyDate && user.penaltyDate !== "nada"
      ? new Date(user.penaltyDate)
      : null);

  const validUntil =
    until && !Number.isNaN(until.getTime()) ? until : null;

  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    idRole: user.idRole,
    eliminated: Boolean(user.eliminated),
    banned: Boolean(validUntil),
    bannedUntil: validUntil ? validUntil.toISOString() : null,
    banReason: validUntil ? user.banReason || null : null,
    penaltyDate: user.penaltyDate,
    followerAmount: user.followerAmount,
    followingAmount: user.followingAmount,
  };
};

// =====================================================
// LISTAR Y BUSCAR USUARIOS
// =====================================================

// GET /admin/users?q=...
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
        "penaltyDate",
        "followerAmount",
        "followingAmount",
      ],
      order: [["username", "ASC"]],
      limit: 100,
    });

    return res.status(200).json({
      users: users.map(serializeUser),
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);

    return res.status(500).json({
      message: "Error al obtener los usuarios",
    });
  }
};

// =====================================================
// BANEAR USUARIOS
// =====================================================

// PATCH /admin/ban/:userId
// PATCH /admin/users/:id/ban
const banUser = async (req, res) => {
  try {
    // Compatibilidad con las dos rutas originales.
    const targetId = Number(
      req.params.userId || req.params.id
    );

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({
        message: "El ID del usuario no es válido",
      });
    }

    const target = await User.findByPk(targetId);

    if (!target || target.eliminated) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    // Evitar autobaneo.
    if (Number(target.userId) === Number(req.user.userId)) {
      return res.status(400).json({
        message: "No podés sancionar tu propia cuenta",
      });
    }

    // No permitir banear administradores.
    if (await isAdminUser(target)) {
      return res.status(403).json({
        message: "No se puede banear a un administrador",
      });
    }

    const { durationMinutes, reason } = req.body || {};

    const duration = req.body?.duration;

    let banMilliseconds;
    let permanent = false;
    let finalDurationMinutes = null;

    // Baneo permanente.
    if (duration === "perm") {
      permanent = true;
    }

    // Duraciones predefinidas de HEAD.
    else if (duration && DURATIONS[duration]) {
      banMilliseconds = DURATIONS[duration];
      finalDurationMinutes = banMilliseconds / MINUTE;
    }

    // Duración personalizada de update/access.
    else {
      const minutes = normalizeDuration(durationMinutes);

      if (!minutes) {
        return res.status(400).json({
          message: "Duración de baneo inválida",
        });
      }

      finalDurationMinutes = minutes;
      banMilliseconds = minutes * MINUTE;
    }

    const banDate = permanent
      ? PERMANENT_DATE
      : new Date(Date.now() + banMilliseconds).toISOString();

    const bannedUntil = new Date(banDate);

    const banReason = String(reason || "")
      .trim()
      .slice(0, 255) || null;

    // Guardar ambos formatos de fecha.
    target.penaltyDate = banDate;
    target.bannedUntil = bannedUntil;
    target.banReason = banReason;

    // Ocultar contadores durante la sanción.
    target.followerAmount = 0;
    target.followingAmount = 0;

    await target.save();

    // Información enviada al usuario sancionado.
    const payload = {
      code: "BANNED",
      message: permanent
        ? "Tu cuenta fue suspendida permanentemente."
        : `Tu cuenta está suspendida temporalmente hasta el ${bannedUntil.toLocaleString("es-AR")}.`,
      bannedUntil: bannedUntil.toISOString(),
      banReason,
      durationMinutes: finalDurationMinutes,
      permanent,
    };

    // Registrar el baneo en el sistema de sockets.
    rememberBan(target.userId, payload);

    // Avisar a todas las sesiones del usuario.
    emitToAccount(target.userId, "account:banned", payload);

    // Desconectar todas las conexiones activas.
    scheduleDisconnect(target.userId);

    return res.status(200).json({
      message: "Usuario baneado correctamente",
      user: serializeUser(target),
      ban: payload,
      penaltyDate: banDate,
    });

  } catch (error) {
    console.error("Error al banear usuario:", error);

    return res.status(500).json({
      message: "Error al banear usuario",
    });
  }
};

// =====================================================
// DESBANEAR USUARIOS
// =====================================================

// PATCH /admin/unban/:userId
// DELETE /admin/users/:id/ban
const unbanUser = async (req, res) => {
  try {
    // Compatibilidad con las dos rutas originales.
    const targetId = Number(
      req.params.userId || req.params.id
    );

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({
        message: "El ID del usuario no es válido",
      });
    }

    const target = await User.findByPk(targetId);

    if (!target || target.eliminated) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    // Restaurar las fechas y el motivo de sanción.
    target.penaltyDate = "nada";
    target.bannedUntil = null;
    target.banReason = null;

    // Recuperar seguidores y seguidos desde las amistades reales.
    const friendIds = await getFriendIds(target.userId);
    const amount = friendIds.length;

    target.followerAmount = amount;
    target.followingAmount = amount;

    await target.save();

    // Eliminar el registro del sistema de sockets.
    forgetBan(target.userId);

    // Notificar a las sesiones del usuario.
    emitToAccount(target.userId, "account:unbanned", {
      message: "La sanción de tu cuenta fue levantada",
    });

    return res.status(200).json({
      message: "Usuario desbaneado correctamente",
      user: serializeUser(target),
      penaltyDate: "nada",
    });

  } catch (error) {
    console.error("Error al desbanear usuario:", error);

    return res.status(500).json({
      message: "Error al desbanear usuario",
    });
  }
};

// =====================================================
// ELIMINAR PUBLICACIONES DESDE ADMINISTRACIÓN
// =====================================================

// PATCH /admin/DeletePost/:id
const adminDeletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Post.db.base.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        message: "Publicación no encontrada",
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        message: "Publicación no encontrada",
      });
    }

    if (post.eliminated) {
      return res.status(400).json({
        message: "La publicación ya está eliminada",
      });
    }

    // Verificar que el autor no sea administrador.
    const author = await User.findByPk(post.userId, {
      attributes: ["userId", "idRole"],
      raw: true,
    });

    if (!author) {
      return res.status(404).json({
        message: "Autor no encontrado",
      });
    }

    if (await isAdminUser(author)) {
      return res.status(403).json({
        message: "No se puede eliminar la publicación de un administrador",
      });
    }

    // Soft delete.
    post.eliminated = true;

    await post.save();

    // Descontar respuestas del post padre.
    if (post.parentId) {
      await Post.updateOne(
        {
          _id: post.parentId,
          commentsCount: { $gt: 0 },
        },
        {
          $inc: { commentsCount: -1 },
        }
      );
    }

    // Eliminar notificaciones relacionadas.
    await removeNotifications({
      type: "friend_post",
      postId: String(post._id),
    });

    return res.status(200).json({
      message: "Publicación eliminada correctamente",
    });

  } catch (error) {
    console.error("Error al eliminar publicación (admin):", error);

    return res.status(500).json({
      message: "Error al eliminar la publicación",
    });
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  listUsers,
  banUser,
  unbanUser,
  adminDeletePost,
};
