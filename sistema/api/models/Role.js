const sequelize = require("../config/db");
const { DataTypes } = require('sequelize');

const Role = sequelize.define('Role', {
    idRole: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('Admin', 'User'),
        allowNull: false,
    },
}, {
    timestamps: false,
    modelName: 'Role',
    hooks: {
        afterSync: async () => {
            const count = await Role.count();
            if (count === 0) {
                await Role.bulkCreate([
                    { role: 'User' },
                    { role: 'Admin' }
                ]);
            }
        }
    }
});

module.exports = Role;