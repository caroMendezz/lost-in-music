const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Usuario = sequelize.define('usuario', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  nombre: DataTypes.STRING(100),
  email: DataTypes.STRING(100),
  contraseña: DataTypes.STRING(255),
  descripcion: DataTypes.TEXT,
  DVH: DataTypes.STRING(255),
  rol: DataTypes.STRING(50),
  eliminado: DataTypes.TINYINT(1),
  cant_seguidores: DataTypes.INTEGER(11),
  cant_seguidos: DataTypes.INTEGER(11),
  foto_perfil: DataTypes.STRING(255),
  banner: DataTypes.STRING(255),
  id_amigo: DataTypes.INTEGER(11),
  ubicacion: DataTypes.STRING(150),
  fecha_penalizacion: DataTypes.DATE
});

module.exports = {
  Usuario
};