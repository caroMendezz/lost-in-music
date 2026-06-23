const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Indexes = sequelize.define('indexes', {
  indexesId: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },
    descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
    multimedia: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
    cant_likes: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
    es_comentarios: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },
    cant_compartidos: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
});

module.exports = {
    Indexes
}