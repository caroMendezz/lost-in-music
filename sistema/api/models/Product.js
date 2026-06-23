const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Product = sequelize.define("product", {
    productId: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },

    title: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    category: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    condition: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    available: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    location: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    image: {
        type: DataTypes.STRING(225),
        allowNull: false
    },

    rating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },

    deliveryType: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    userId: {
        type: DataTypes.INTEGER(11),
        allowNull: false
    }
});

module.exports = {
    Product
};