const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

/**
 * Una fila = una relación entre dos usuarios.
 *   pending  -> requesterId le envió una solicitud a addresseeId
 *   accepted -> son amigos (la amistad es mutua)
 *
 * No hay claves foráneas a propósito: así `sequelize.sync()` crea la tabla
 * sin depender del charset/engine de la tabla Users.
 */
const Friendship = sequelize.define("Friendship", {
  friendshipId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  requesterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  addresseeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM("pending", "accepted"),
    allowNull: false,
    defaultValue: "pending",
  },
}, {
  tableName: "Friendships",
  indexes: [
    // No se puede repetir la misma solicitud
    { unique: true, fields: ["requesterId", "addresseeId"] },
    // Para listar rápido las solicitudes recibidas
    { fields: ["addresseeId", "status"] },
  ],
});

module.exports = { Friendship };