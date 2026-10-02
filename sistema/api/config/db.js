const Sequelize = require('sequelize')

const sequelize = new Sequelize('lim', 'root', '4573', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize