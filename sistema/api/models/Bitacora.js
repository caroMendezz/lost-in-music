const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Bitacora = sequelize.define('bitácora', {
  id_bitacora_usuario: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
    fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
    tipo_accion: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
    descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
    usuario_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    unique: true
  },
});

module.exports = {
    Bitacora
}