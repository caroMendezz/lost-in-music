const mongoose = require("mongoose")

const PostSchema = new mongoose.Schema({

    autorId: {
        type: Number, // ID del usuario en SQL
        required: true
    },

    postText: {
        type: String,
        maxlength: 1000
    },

    image: [{
        type: String
    }],

    videos: [{
        type: String
    }],

    likesCount: {
    type: Number,
    default: 0
    },

    commentsCount: {
    type: Number,
    default: 0
    },

    eliminated: {
        type: Boolean,
        default: false
        }

}, {
    timestamps: true
})

module.exports = mongoose.model("Post", PostSchema)