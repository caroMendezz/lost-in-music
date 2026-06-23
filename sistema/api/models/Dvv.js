const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Dvv = sequelize.define('dvv', {

    tableName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
    DVVvalue: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
});

module.exports = {
   Dvv   
}