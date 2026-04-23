const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Publicaciones = sequelize.define('publicaciones', {
  id_usuario: DataTypes.INTEGER(11),
  id_publicacion: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  guardado: DataTypes.TINYINT(1),
  likes: DataTypes.TINYINT(1)
});

module.exports = {
    Publicaciones
}