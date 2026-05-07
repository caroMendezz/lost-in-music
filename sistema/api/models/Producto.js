const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Producto = sequelize.define('producto', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },
  título: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  disponibilidad: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },
    ubicación: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imagen: {
    type: DataTypes.STRING(225),
    allowNull: false,
  },
  puntuación: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  tipo_entrega: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    unique: true
  },
});

module.exports = {
    Producto   
}