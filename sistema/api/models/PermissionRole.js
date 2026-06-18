const sequelize = require("../config/db");
const { DataTypes } = require('sequelize');
const Permission = require("./Permission");
const Role = require("./Role");

const PermissionRole = sequelize.define('PermissionRole', {
   

}, {
    timestamps: false,
    modelName: 'PermissionRole'
})

Tag.belongsToMany(Permission, {
    through: PermissionRole
})
Auction.belongsToMany(Role, {
    through: PermissionRole
})

module.exports = PermissionRole