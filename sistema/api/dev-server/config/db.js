// Solo para pruebas: base SQLite local en lugar de MySQL.
const path = require("path");
const { Sequelize } = require("sequelize");

module.exports = new Sequelize({
  dialect: "sqlite",
  // SQLITE_STORAGE permite correr una copia aislada de la base (solo para verificacion)
  storage: process.env.SQLITE_STORAGE || path.join(__dirname, "..", "dev.sqlite"),
  logging: false
});
