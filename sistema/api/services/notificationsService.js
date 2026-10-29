const { UserNotification } = require("../models/UserNotification");
const { getFriendIds } = require("./friendsService");
const { emitToUser } = require("../sockets/presence");

/**
 * Todas estas funciones capturan sus propios errores: una notificación que falla
 * nunca debe romper la acción principal (enviar una solicitud, publicar un post...).
 *
 * Eventos de socket.io que se envían al usuario (por el namespace /presence):
 *   notifications:new      -> le llegó una notificación nueva
 *   notifications:changed  -> se quitaron / marcaron notificaciones (sincroniza otras pestañas)
 */

// Fragmento del post que se muestra en la notificación
const buildPreview = (post) => {
  const text = (post.postText || "").trim();
  if (text) return text.length > 100 ? `${text.slice(0, 100)}…` : text;
  if (post.image && post.image.length > 0) return "📷 Foto";
  if (post.videos && post.videos.length > 0) return "🎬 Video";
  return "";
};

// Crea una notificación para un usuario y se la avisa en tiempo real
const notifyUser = async ({ userId, actorId, type, postId = null, preview = null }) => {
  try {
    await UserNotification.create({ userId, actorId, type, postId, preview });
    emitToUser(userId, "notifications:new");
  } catch (error) {
    console.error("Error al crear la notificación:", error.message);
  }
};

// Un amigo hizo un post: una notificación para cada uno de sus amigos
const notifyFriendsOfPost = async (post, authorId) => {
  try {
    const friendIds = await getFriendIds(authorId);
    if (friendIds.length === 0) return;

    const preview = buildPreview(post);
    await UserNotification.bulkCreate(
      friendIds.map((friendId) => ({
        userId: friendId,
        actorId: authorId,
        type: "friend_post",
        postId: String(post._id),
        preview,
      }))
    );

    friendIds.forEach((friendId) => emitToUser(friendId, "notifications:new"));
  } catch (error) {
    console.error("Error al notificar a los amigos del post:", error.message);
  }
};

/**
 * Borra las notificaciones que cumplan el filtro (por ejemplo { userId, actorId, type })
 * y les avisa a los usuarios afectados para que actualicen su lista.
 */
const removeNotifications = async (filter) => {
  try {
    const affected = await UserNotification.findAll({
      where: filter,
      attributes: ["userId"],
      raw: true,
    });
    if (affected.length === 0) return;

    await UserNotification.destroy({ where: filter });

    [...new Set(affected.map((n) => n.userId))].forEach((userId) =>
      emitToUser(userId, "notifications:changed")
    );
  } catch (error) {
    console.error("Error al quitar notificaciones:", error.message);
  }
};

module.exports = { notifyUser, notifyFriendsOfPost, removeNotifications };