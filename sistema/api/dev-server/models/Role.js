// Solo para pruebas: tu User.js hace require("./Role"), este archivo no estaba entre los que me pasaste.
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

module.exports = sequelize.define("Role", {
  idRole: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false }
});
