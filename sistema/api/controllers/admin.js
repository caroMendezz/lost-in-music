const { User } = require("../models/User");
const Post = require("../models/Post");
const { removeNotifications } = require("../services/notificationsService");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Duraciones soportadas (mismas que el <select> del frontend).
const DURATIONS = {
  "1h": HOUR,
  "6h": 6 * HOUR,
  "24h": DAY,
  "7d": 7 * DAY,
  "30d": 30 * DAY,
};

const PERMANENT_DATE = "9999-12-31T23:59:59.999Z";

/**
 * PATCH /admin/ban/:userId
 * body: { duration: '1h' | '6h' | '24h' | '7d' | '30d' | 'perm' }
 */
const banUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "El ID del usuario no es válido" });
    }

    const { duration } = req.body || {};

    if (!duration || (duration !== "perm" && !DURATIONS[duration])) {
      return res.status(400).json({ message: "Duración de ban inválida" });
    }

    const target = await User.findByPk(userId);

    if (!target || target.eliminated) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (Number(target.idRole) === 2) {
      return res
        .status(403)
        .json({ message: "No se puede banear a un administrador" });
    }

    const penaltyDate =
      duration === "perm"
        ? PERMANENT_DATE
        : new Date(Date.now() + DURATIONS[duration]).toISOString();

    target.penaltyDate = penaltyDate;
    await target.save();

    return res.status(200).json({
      message: "Usuario baneado correctamente",
      penaltyDate,
    });
  } catch (error) {
    console.error("Error al banear usuario:", error);
    return res.status(500).json({ message: "Error al banear usuario" });
  }
};

/**
 * PATCH /admin/unban/:userId
 */
const unbanUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "El ID del usuario no es válido" });
    }

    const target = await User.findByPk(userId);

    if (!target || target.eliminated) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    target.penaltyDate = "nada";
    await target.save();

    return res.status(200).json({
      message: "Usuario desbaneado correctamente",
      penaltyDate: "nada",
    });
  } catch (error) {
    console.error("Error al desbanear usuario:", error);
    return res.status(500).json({ message: "Error al desbanear usuario" });
  }
};

/**
 * PATCH /admin/DeletePost/:id
 * El admin puede eliminar publicaciones y respuestas de usuarios NO admin.
 * Es soft delete (eliminated: true), igual que el endpoint normal.
 */
const adminDeletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Post.db.base.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    if (post.eliminated) {
      return res.status(400).json({ message: "La publicación ya está eliminada" });
    }

    // Verificar que el autor no sea admin.
    const author = await User.findByPk(post.userId, {
      attributes: ["userId", "idRole"],
      raw: true,
    });

    if (!author) {
      return res.status(404).json({ message: "Autor no encontrado" });
    }

    if (Number(author.idRole) === 2) {
      return res.status(403).json({
        message: "No se puede eliminar la publicación de un administrador",
      });
    }

    post.eliminated = true;
    await post.save();

    // Si era una respuesta, descontar del post padre.
    if (post.parentId) {
      await Post.updateOne(
        { _id: post.parentId, commentsCount: { $gt: 0 } },
        { $inc: { commentsCount: -1 } }
      );
    }

    await removeNotifications({ type: "friend_post", postId: String(post._id) });

    return res
      .status(200)
      .json({ message: "Publicación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar publicación (admin):", error);
    return res
      .status(500)
      .json({ message: "Error al eliminar la publicación" });
  }
};

module.exports = { banUser, unbanUser, adminDeletePost };