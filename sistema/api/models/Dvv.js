const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Dvv = sequelize.define('dvv', {
  nombre_tabla: DataTypes.STRING(100),
  valor_DVV: DataTypes.STRING(255)
});

module.exports = {
   Dvv   
}