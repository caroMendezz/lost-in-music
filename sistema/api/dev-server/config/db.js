// Solo para pruebas: base SQLite local en lugar de MySQL.
const path = require("path");
const { Sequelize } = require("sequelize");

module.exports = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "dev.sqlite"),
  logging: false
});
