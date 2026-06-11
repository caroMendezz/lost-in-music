const CommentSchema = new mongoose.Schema({

    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },

    usuarioId: {
        type: Number,
        required: true
    },

    texto: {
        type: String,
        required: true
    }

}, {
    timestamps: true
})