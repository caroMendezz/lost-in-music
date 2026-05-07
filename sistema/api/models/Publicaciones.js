const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Publicaciones = sequelize.define('publicaciones', {
    id_usuario: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    unique: true
  },
  id_publicacion: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
    guardado: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },
    likes: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },

});

module.exports = {
    Publicaciones
}