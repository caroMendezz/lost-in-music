const Sequelize = require('sequelize')
//Santi y caro, si no tienen contraseña borren el mío y usen este que les pongo en la línea 3
//const sequelize = new Sequelize('lim', 'root', '', {
const sequelize = new Sequelize('lim', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize