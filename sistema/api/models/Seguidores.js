const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Seguidores = sequelize.define('seguidores', {
  id_seguidor: DataTypes.INTEGER(11),
  id_seguido: DataTypes.INTEGER(11),
  fecha: DataTypes.DATE
});

module.exports = {
    Seguidores   
}