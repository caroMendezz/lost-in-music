const { Op } = require("sequelize");
const { User } = require("../models/User");
const { Friendship } = require("../models/Friendship");
const { getFriendIds, findRelation } = require("../services/friendsService");
const { isOnline, emitToUser } = require("../sockets/presence");
const { notifyUser, removeNotifications } = require("../services/notificationsService");

// 👇 AGREGAMOS "penaltyDate" ACÁ PARA PODER FILTRAR 👇
const USER_ATTRS = ["userId", "username", "profilePhoto", "ubication", "penaltyDate"];

const getCurrentUserId = (req) => req.user.userId || req.user.id;

// Lee y valida el :userId de la URL
const parseTargetId = (req) => {
  const id = Number(req.params.userId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Trae usuarios por id y los devuelve en un Map(userId -> usuario)
const loadUsers = async (ids) => {
  if (ids.length === 0) return new Map();
  const users = await User.findAll({
    where: { userId: ids, eliminated: 0 },
    attributes: USER_ATTRS,
    raw: true,
  });
  return new Map(users.map((u) => [u.userId, u]));
};

// Helper para saber si está baneado
const isUserBanned = (penaltyDate) => {
  if (!penaltyDate || penaltyDate === 'nada') return false;
  const banDate = new Date(penaltyDate);
  if (Number.isNaN(banDate.getTime())) return false;
  return banDate.getTime() > Date.now();
};

// Avisa en tiempo real a los dos usuarios que su lista de amigos/solicitudes cambió
const notifyChange = (a, b) => {
  emitToUser(a, "friends:changed");
  emitToUser(b, "friends:changed");
};

// GET /friends -> mis amigos, con su estado de conexión
const getFriends = async (req, res) => {
  try {
    const me = getCurrentUserId(req);
    const friendIds = await getFriendIds(me);
    const users = await loadUsers(friendIds);

    const friends = [...users.values()]
      .filter((u) => !isUserBanned(u.penaltyDate)) // 👈 FILTRO DE BANEADOS
      .sort((a, b) => a.username.localeCompare(b.username))
      .map((u) => {
        // Ocultamos penaltyDate de la respuesta
        const { penaltyDate, ...userData } = u;
        return { ...userData, online: isOnline(u.userId) };
      });

    return res.status(200).json(friends);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los amigos" });
  }
};

// GET /friends/requests -> { received: [...], sent: [...] }
const getFriendRequests = async (req, res) => {
  try {
    const me = getCurrentUserId(req);

    const rows = await Friendship.findAll({
      where: {
        status: "pending",
        [Op.or]: [{ requesterId: me }, { addresseeId: me }],
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    const otherId = (r) => (r.requesterId === me ? r.addresseeId : r.requesterId);
    const users = await loadUsers(rows.map(otherId));

    const build = (list) =>
      list
        .map((r) => {
           const u = users.get(otherId(r));
           if (!u || isUserBanned(u.penaltyDate)) return null; // Filtramos baneados
           const { penaltyDate, ...userData } = u;
           return { ...userData, requestedAt: r.createdAt };
        })
        .filter(Boolean);

    return res.status(200).json({
      received: build(rows.filter((r) => r.addresseeId === me)),
      sent: build(rows.filter((r) => r.requesterId === me)),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener las solicitudes" });
  }
};

const searchPeople = async (req, res) => {
  try {
    const me = getCurrentUserId(req);
    const isAdmin = Number(req.user.idRole) === 2; // 👈 Verificamos si es admin
    const q = String(req.query.q || "").trim();

    if (q.length < 2) return res.status(200).json([]);

    const escaped = q.replace(/[\\%_]/g, "\\$&");

    const usersRaw = await User.findAll({
      where: {
        userId: { [Op.ne]: me },
        eliminated: 0,
        username: { [Op.like]: `%${escaped}%` },
      },
      attributes: USER_ATTRS,
      order: [["username", "ASC"]],
      limit: 20,
      raw: true,
    });

    // 👇 FILTRAR BANEADOS SOLO SI NO ES ADMIN 👇
    const users = usersRaw.filter((u) => isAdmin || !isUserBanned(u.penaltyDate));

    if (users.length === 0) return res.status(200).json([]);

    const ids = users.map((u) => u.userId);
    const relations = await Friendship.findAll({
      where: {
        [Op.or]: [
          { requesterId: me, addresseeId: ids },
          { addresseeId: me, requesterId: ids },
        ],
      },
      raw: true,
    });

    const relationOf = new Map();
    relations.forEach((r) => {
      const other = r.requesterId === me ? r.addresseeId : r.requesterId;
      if (r.status === "accepted") relationOf.set(other, "friend");
      else relationOf.set(other, r.requesterId === me ? "pending_sent" : "pending_received");
    });

    return res.status(200).json(
      users.map((u) => {
        const relation = relationOf.get(u.userId) || "none";
        const { penaltyDate, ...userData } = u;
        return {
          ...userData,
          relation,
          online: relation === "friend" ? isOnline(u.userId) : false,
        };
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al buscar personas" });
  }
};

// POST /friends/request/:userId
const sendFriendRequest = async (req, res) => {
  try {
    const me = getCurrentUserId(req);
    const other = parseTargetId(req);

    if (!other) return res.status(400).json({ message: "Usuario inválido" });
    if (other === me) {
      return res.status(400).json({ message: "No podés agregarte a vos mismo" });
    }

    const target = await User.findOne({
      where: { userId: other, eliminated: 0 },
      attributes: ["userId", "penaltyDate"],
    });
    
    if (!target) return res.status(404).json({ message: "Usuario no encontrado" });
    if (isUserBanned(target.penaltyDate)) {
       return res.status(403).json({ message: "No podés enviar una solicitud a un usuario suspendido" });
    }

    const existing = await findRelation(me, other);

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(409).json({ message: "Ya son amigos" });
      }
      if (existing.requesterId === me) {
        return res.status(409).json({ message: "Ya enviaste una solicitud a este usuario" });
      }
      existing.status = "accepted";
      await existing.save();
      await removeNotifications({ userId: me, actorId: other, type: "friend_request" });
      notifyChange(me, other);
      return res.status(200).json({ relation: "friend" });
    }

    await Friendship.create({ requesterId: me, addresseeId: other, status: "pending" });
    await notifyUser({ userId: other, actorId: me, type: "friend_request" });
    notifyChange(me, other);

    return res.status(201).json({ relation: "pending_sent" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Ya existe una solicitud con este usuario" });
    }
    console.error(error);
    return res.status(500).json({ message: "Error al enviar la solicitud" });
  }
};

// PATCH /friends/accept/:userId
const acceptFriendRequest = async (req, res) => {
  try {
    const me = getCurrentUserId(req);
    const other = parseTargetId(req);
    if (!other) return res.status(400).json({ message: "Usuario inválido" });

    const request = await Friendship.findOne({
      where: { requesterId: other, addresseeId: me, status: "pending" },
    });
    if (!request) {
      return res.status(404).json({ message: "No tenés una solicitud pendiente de este usuario" });
    }

    request.status = "accepted";
    await request.save();
    await removeNotifications({ userId: me, actorId: other, type: "friend_request" });
    notifyChange(me, other);

    return res.status(200).json({ relation: "friend" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al aceptar la solicitud" });
  }
};

// DELETE /friends/:userId
const removeFriendship = async (req, res) => {
  try {
    const me = getCurrentUserId(req);
    const other = parseTargetId(req);
    if (!other) return res.status(400).json({ message: "Usuario inválido" });

    const relation = await findRelation(me, other);
    if (!relation) return res.status(404).json({ message: "No hay ninguna relación con este usuario" });

    const wasPending = relation.status === "pending";
    const { requesterId, addresseeId } = relation;
    await relation.destroy();

    if (wasPending) {
      await removeNotifications({ userId: addresseeId, actorId: requesterId, type: "friend_request" });
    }
    notifyChange(me, other);

    return res.status(200).json({ relation: "none" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar la amistad" });
  }
};

const getUserFriends = async (req, res) => {
  try {
    const targetId = Number(req.params.userId);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ message: "Usuario inválido" });
    }

    // 👇 VERIFICAMOS SI EL QUE PREGUNTA ES ADMIN 👇
    const isAdmin = Number(req.user.idRole) === 2;

    const targetUser = await User.findByPk(targetId);
    
    // Si el dueño del perfil está baneado y el que mira NO es admin -> ocultar lista
    if (targetUser && !isAdmin && isUserBanned(targetUser.penaltyDate)) {
       return res.status(200).json([]);
    }

    const friendIds = await getFriendIds(targetId);
    const users = await loadUsers(friendIds);

    const friends = [...users.values()]
      // Si el que mira NO es admin, ocultamos a los amigos que estén baneados. 
      // Si ES admin, le mostramos todo.
      .filter((u) => isAdmin || !isUserBanned(u.penaltyDate))
      .sort((a, b) => a.username.localeCompare(b.username))
      .map((u) => {
        const { penaltyDate, ...userData } = u;
        return userData;
      });

    return res.status(200).json(friends);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los amigos del usuario" });
  }
};

module.exports = {
  getFriends,
  getFriendRequests,
  searchPeople,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  getUserFriends,
};