const mongoose = require("mongoose")


const ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        maxlength: 1000
    },

    image: [{
        type: String
    }],

    category: [{
        type: String,
        enum: ["Cuerda", "Viento", "Percusion", "Electronicos", "Complementos"]
    }],

    condition: [{
        type: String,
        enum: ["Nuevo","Usado"]
    }],

    available: {
        type: Boolean,
        default: true
        },

    price: [{
        type: String
        }],

    location: [{
        type: String
        }],

    description: [{
        type: String
        }],

    rating: [{
        type: String
        }],

    deliveryType: [{
        type: String
        }],

    userId: {
        type: Number, 
        required: true
        },

    eliminated: {
        type: Boolean,
        default: false
        },
    
}, {
    timestamps: true
})

module.exports = mongoose.model("Product", ProductSchema, "Product")
