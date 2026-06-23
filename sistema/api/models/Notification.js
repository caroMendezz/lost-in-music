const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Notification = sequelize.define('Notification', {
  NotificationId: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = {
  Notification   
}