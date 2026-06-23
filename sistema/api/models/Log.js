const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Log = sequelize.define("log", {
    logiId: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },

    date: {
        type: DataTypes.DATE,
        allowNull: false
    },

    actionType: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    userId: {
        type: DataTypes.INTEGER(11),
        allowNull: false
    }
});

module.exports = {
    Log
};