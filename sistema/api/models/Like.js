const mongoose = require("mongoose")

const LikeSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },

    userId: {
        type: Number, // ID del usuario en SQL
        required: true
    }
}, {
    timestamps: true
})

// Un usuario solo puede dar un like por post (lo garantiza la base de datos)
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true })

module.exports = mongoose.model("Like", LikeSchema, "Like")