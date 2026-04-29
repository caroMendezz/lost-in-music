const Sequelize = require('sequelize')

const sequelize = new Sequelize('lim', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize