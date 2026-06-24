const Post = require("../models/Post")
const {User} = require("../models/User")

const createPost = async (req, res) => {

    try {

        const { userId, postText } = req.body

        const user = await User.findByPk(userId)

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }

        const post = await Post.create({
            userId,
            postText
        })

        return res.status(201).json(post)

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Error interno",
            error: error.message
        })

    }

}


const deletePost = async (req, res) => {

    try {

        const { postId } = req.params

        const post = await Post.findById(id)

        if (!post) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            })
        }

        if (post.eliminated) {
            return res.status(400).json({
                message: "La publicación ya está eliminada"
            })
        }

        post.eliminated = true

        await post.save()

        return res.status(200).json({
            message: "Publicación eliminada correctamente"
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Error interno del servidor"
        })

    }

}

const updatePost = async (req, res) => {

    try {

        const { postId } = req.params

        const {
            postText,
            image,
            videos
        } = req.body

        const dataUpdate = {}

        if (postText !== undefined)
            dataUpdate.postText = postText
        if (image !== undefined)
            dataUpdate.image = image

        if (videos !== undefined)
            dataUpdate.videos = videos

        if (Object.keys(dataUpdate).length === 0) {
            return res.status(400).json({
                message: "No se enviaron datos para actualizar"
            })
        }

        const post = await Post.findOneAndUpdate(
            {
                _id: postId,
                eliminated: false
            },
            dataUpdate,
            {
                new: true,
                runValidators: true
            }
        )

        if (!post) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            })
        }

        res.status(200).json(post)

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Error interno"
        })

    }

}


module.exports = {
    createPost,
    deletePost,
    updatePost
}