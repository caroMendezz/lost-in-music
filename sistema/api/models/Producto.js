const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Producto = sequelize.define('producto', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  título: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  disponibilidad: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    unique: true
  },
    título: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },

  estado: DataTypes.STRING(50),
  disponibilidad: DataTypes.TINYINT(1),
  ubicación: DataTypes.STRING(150),
  descripcion: DataTypes.TEXT,
  precio: DataTypes.DECIMAL(10, 2),
  imagen: DataTypes.STRING(255),
  puntuación: DataTypes.FLOAT,
  tipo_entrega: DataTypes.STRING(100),
  usuario_id: DataTypes.INTEGER(11)
});

module.exports = {
    Producto   
}