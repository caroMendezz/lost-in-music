const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Followers = sequelize.define('Followers', {
  followerId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  followingId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },

});

module.exports = {
  Followers   
}