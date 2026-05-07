const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Seguidores = sequelize.define('seguidores', {
  id_seguidor: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  id_seguido: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },

});

module.exports = {
    Seguidores   
}