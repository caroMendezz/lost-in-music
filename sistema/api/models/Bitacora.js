const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Bitacora = sequelize.define('bitácora', {
  id_bitacora_usuario: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  fecha: DataTypes.DATE,
  tipo_accion: DataTypes.STRING(100),
  descripcion: DataTypes.TEXT,
  usuario_id: DataTypes.INTEGER(11)
});

module.exports = {
    Bitacora
}