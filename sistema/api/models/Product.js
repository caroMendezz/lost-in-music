const mongoose = require("mongoose")


const ProductSchema = new mongoose.Schema({
    productId: {
        type: Number, // ID del usuario en SQL
        required: true
    },

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
    
}, {
    timestamps: true
})

// CORRECCIÓN: Usa PostSchema que es el nombre real de tu variable
module.exports = mongoose.model("Product", PostSchema)
