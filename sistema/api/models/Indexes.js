const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Indexes = sequelize.define('indexes', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  descripcion: DataTypes.TEXT,
  multimedia: DataTypes.STRING(255),
  cant_likes: DataTypes.INTEGER(11),
  es_comentarios: DataTypes.TINYINT(1),
  cant_compartidos: DataTypes.INTEGER(11)
});

module.exports = {
    Indexes
}