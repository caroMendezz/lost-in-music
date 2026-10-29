const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

/**
 * Una notificación para un usuario.
 *
 * Tipos (type):
 *   friend_request -> actorId te envió una solicitud de amistad
 *   friend_post    -> actorId (tu amigo) hizo una publicación; postId apunta al post (Mongo)
 *
 * `type` es un STRING (no un ENUM) para poder agregar tipos nuevos sin modificar la tabla.
 * Se guarda en la tabla UserNotifications, así que no toca tu modelo Notification existente.
 */
const UserNotification = sequelize.define("UserNotification", {
  notificationId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // Quién recibe la notificación
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // Quién la provoca (el que envió la solicitud / hizo el post)
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  type: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },

  // _id del post en Mongo (como texto), solo para friend_post
  postId: {
    type: DataTypes.STRING(24),
    allowNull: true,
  },

  // Fragmento del texto del post, para mostrarlo en la notificación
  preview: {
    type: DataTypes.STRING(160),
    allowNull: true,
  },

  // null = todavía no la vio (es lo que enciende el punto rojo)
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "UserNotifications",
  indexes: [
    { fields: ["userId", "createdAt"] },
    { fields: ["postId"] },
  ],
});

module.exports = { UserNotification };