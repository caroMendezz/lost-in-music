const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

// =====================================================
// REPORTES
// =====================================================
//
// Un reporte puede apuntar a:
//   - un usuario  (targetType = "user")
//   - una publicación (targetType = "post"); en ese caso también se
//     guarda el autor de la publicación en targetUserId, para que el
//     administrador pueda sancionarlo desde el mismo reporte.
//
// La publicación vive en MongoDB, así que se guarda una copia del texto
// y de la primera imagen: si el autor borra el post, el administrador
// igual puede ver qué se reportó.
//
// Estados:
//   pending   -> esperando revisión del administrador
//   resolved  -> el administrador tomó una acción (por ejemplo, sancionó)
//   dismissed -> el administrador decidió no hacer nada

const Report = sequelize.define(
  "Report",
  {
    reportId: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },

    // Usuario que hizo el reporte.
    reporterId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    targetType: {
      type: DataTypes.ENUM("user", "post"),
      allowNull: false,
    },

    // Usuario reportado. Si el reporte es de una publicación, es su autor.
    targetUserId: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },

    // Publicación reportada (ObjectId de MongoDB como texto).
    targetPostId: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },

    // Copia de datos para que el reporte siga siendo legible aunque
    // el usuario cambie su nombre o borre la publicación.
    targetUsername: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    postText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    postImage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Razón escrita por quien reporta.
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("pending", "resolved", "dismissed"),
      allowNull: false,
      defaultValue: "pending",
    },

    // Administrador que revisó el reporte.
    reviewedBy: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },

    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Nota opcional de la resolución (por ejemplo, la sanción aplicada).
    resolutionNote: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "reports",
    timestamps: true,
    indexes: [
      { fields: ["status"] },
      { fields: ["targetType"] },
      { fields: ["targetUserId"] },
      { fields: ["targetPostId"] },
      { fields: ["reporterId"] },
    ],
  }
);

module.exports = Report;
