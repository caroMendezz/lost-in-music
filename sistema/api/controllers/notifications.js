const { User } = require("../models/User");
const { UserNotification } = require("../models/UserNotification");
const { emitToUser } = require("../sockets/presence");

const MAX_ITEMS = 50; // se muestran las 50 más recientes

const getCurrentUserId = (req) => req.user.userId || req.user.id;

/**
 * GET /notifications
 * -> { items, actors, unreadCount }
 *
 * `actors` trae nombre y foto de cada persona UNA sola vez (indexados por userId),
 * en vez de repetir la foto (que puede ser Base64 pesada) en cada notificación.
 */
const getNotifications = async (req, res) => {
  try {
    const me = getCurrentUserId(req);

    const [rows, unreadCount] = await Promise.all([
      UserNotification.findAll({
        where: { userId: me },
        order: [["createdAt", "DESC"]],
        limit: MAX_ITEMS,
        raw: true,
      }),
      UserNotification.count({ where: { userId: me, readAt: null } }),
    ]);

    const actorIds = [...new Set(rows.map((r) => r.actorId))];
    const users = actorIds.length
      ? await User.findAll({
          where: { userId: actorIds },
          attributes: ["userId", "username", "profilePhoto"],
          raw: true,
        })
      : [];

    const actors = {};
    users.forEach((u) => {
      actors[u.userId] = { username: u.username, profilePhoto: u.profilePhoto };
    });

    return res.status(200).json({
      items: rows.map((r) => ({
        notificationId: r.notificationId,
        type: r.type,
        actorId: r.actorId,
        postId: r.postId,
        preview: r.preview,
        read: Boolean(r.readAt),
        createdAt: r.createdAt,
      })),
      actors,
      unreadCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener las notificaciones" });
  }
};

// PATCH /notifications/read -> marca todas como vistas (apaga el punto rojo)
const markNotificationsRead = async (req, res) => {
  try {
    const me = getCurrentUserId(req);

    await UserNotification.update(
      { readAt: new Date() },
      { where: { userId: me, readAt: null } }
    );

    emitToUser(me, "notifications:changed"); // sincroniza otras pestañas
    return res.status(200).json({ unreadCount: 0 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al marcar las notificaciones" });
  }
};

// DELETE /notifications/:id -> quita una notificación (la ✕)
const deleteNotification = async (req, res) => {
  try {
    const me = getCurrentUserId(req);
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Notificación inválida" });
    }

    // El filtro por userId garantiza que solo se puedan borrar las propias
    const deleted = await UserNotification.destroy({
      where: { notificationId: id, userId: me },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    emitToUser(me, "notifications:changed");
    return res.status(200).json({ message: "Notificación eliminada" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar la notificación" });
  }
};

// DELETE /notifications -> quita todas las mías
const clearNotifications = async (req, res) => {
  try {
    const me = getCurrentUserId(req);

    await UserNotification.destroy({ where: { userId: me } });

    emitToUser(me, "notifications:changed");
    return res.status(200).json({ message: "Notificaciones eliminadas" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar las notificaciones" });
  }
};

module.exports = {
  getNotifications,
  markNotificationsRead,
  deleteNotification,
  clearNotifications,
};