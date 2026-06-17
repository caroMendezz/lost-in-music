const Post = require("../models/Post")
const User = require("../models/User")

const createPost = async (req, res) => {

    try {

        const { idUsuario, textoPublicacion } = req.body

        if (!idUsuario || !textoPublicacion) {
            return res.status(400).json({
                message: "Faltan datos"
            })
        }

        const usuario = await User.findById(idUsuario)

        if (!usuario) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }

        const post = await Post.create({
            autor: req.user.id,
            textoPublicacion
        })
        return res.status(201).json(post)

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Error interno"
        })

    }

}


const deletePost = async (req, res) => {

    try {

        const { id } = req.params

        const post = await Post.findById(id)

        if (!post) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            })
        }

        if (post.eliminado) {
            return res.status(400).json({
                message: "La publicación ya está eliminada"
            })
        }

        post.eliminado = true

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

        const { id } = req.params

        const {
            textoPublicacion,
            imagenes,
            videos
        } = req.body

        const datosActualizar = {}

        if (textoPublicacion !== undefined)
            datosActualizar.textoPublicacion = textoPublicacion

        if (imagenes !== undefined)
            datosActualizar.imagenes = imagenes

        if (videos !== undefined)
            datosActualizar.videos = videos

        if (Object.keys(datosActualizar).length === 0) {
            return res.status(400).json({
                message: "No se enviaron datos para actualizar"
            })
        }

        const post = await Post.findOneAndUpdate(
            {
                _id: id,
                eliminado: false
            },
            datosActualizar,
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