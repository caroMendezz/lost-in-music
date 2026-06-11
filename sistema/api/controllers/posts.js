const Post = require("../models/Post")
const User = require("../models/User")

const crearPublicacion = async (req, res) => {

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

module.exports = {
    crearPublicacion
}