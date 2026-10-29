const mongoose = require("mongoose")

const PostSchema = new mongoose.Schema({

    userId: {
        type: Number, // ID del usuario en SQL
        required: true
    },

    postText: {
        type: String,
        maxlength: 2000
    },

    image: [{
        type: String, default: []
    }],

    videos: [{
        type: String, default: []
    }],

    // Si es una respuesta (comentario), apunta al post original. null = post normal
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: null
    },

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

// Feed (parentId null) y respuestas de un post, ordenados por fecha
PostSchema.index({ parentId: 1, eliminated: 1, createdAt: -1 })

module.exports = mongoose.model("Post", PostSchema, "Post")