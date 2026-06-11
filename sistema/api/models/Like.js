const LikeSchema = new mongoose.Schema({

    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },

    usuarioId: {
        type: Number,
        required: true
    }

})