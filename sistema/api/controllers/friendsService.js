const { Op } = require("sequelize");
const { Friendship } = require("../models/Friendship");

// IDs de todos los amigos (amistades aceptadas) de un usuario
const getFriendIds = async (userId) => {
  const rows = await Friendship.findAll({
    where: {
      status: "accepted",
      [Op.or]: [{ requesterId: userId }, { addresseeId: userId }],
    },
    attributes: ["requesterId", "addresseeId"],
    raw: true,
  });

  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
};

// Relación entre dos usuarios, en cualquier sentido (o null si no hay ninguna)
const findRelation = (a, b) =>
  Friendship.findOne({
    where: {
      [Op.or]: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });

module.exports = { getFriendIds, findRelation };