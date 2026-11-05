const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "lim",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    // Muchos proveedores de MySQL en la nube exigen SSL
    dialectOptions:
      process.env.DB_SSL === "true"
        ? { ssl: { rejectUnauthorized: false } }
        : {},
  }
);

module.exports = sequelize;