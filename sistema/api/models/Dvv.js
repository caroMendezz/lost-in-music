const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Dvv = sequelize.define('dvv', {

    nombre_tabla: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
    valor_DVV: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
});

module.exports = {
   Dvv   
}