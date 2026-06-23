const sequelize = require("../config/db");
const { DataTypes } = require('sequelize')

const Permission = sequelize.define('Permission', {
    PermissionId: {
        autoincrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    permission: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false,
    modelName: 'Permission'
})

module.exports = Permission