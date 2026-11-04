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
