const Post = require("../models/Post")
const { User } = require("../models/User")

const toUrls = (files = []) => files.map(f => `/uploads/posts/${f.filename}`)
const getCurrentUserId = (req) => req.user.userId || req.user.id

const createPost = async (req, res) => {
    try {
        const userId = getCurrentUserId(req)
        const postText = (req.body.postText || '').trim()
        const image = toUrls(req.files?.image)
        const videos = toUrls(req.files?.videos)
        console.log('BODY:', req.body);
        console.log('FILES:', req.files);

        if (!postText && image.length === 0 && videos.length === 0) {
            return res.status(400).json({ message: "La publicación no puede estar vacía" })
        }

        const post = await Post.create({ userId, postText, image, videos, eliminated: false })

        const user = await User.findByPk(userId, { attributes: ['username', 'profilePhoto'] })


        return res.status(201).json({
            ...post.toObject(),
            author: user ? user.username : 'Usuario desconocido',
            profilePhoto: user ? user.profilePhoto : '',
            isOwner: true
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error interno", error: error.message })
    }
}

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({ message: "Publicación no encontrada" })
        }
        if (post.userId !== getCurrentUserId(req)) {
            return res.status(403).json({ message: "No podés eliminar esta publicación" })
        }
        if (post.eliminated) {
            return res.status(400).json({ message: "La publicación ya está eliminada" })
        }

        post.eliminated = true
        await post.save()

        return res.status(200).json({ message: "Publicación eliminada correctamente" })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error interno del servidor" })
    }
}

const updatePost = async (req, res) => {
    try {
        const { postText } = req.body

        if (postText === undefined) {
            return res.status(400).json({ message: "No se enviaron datos para actualizar" })
        }

        const post = await Post.findOne({ _id: req.params.id, eliminated: false })

        if (!post) {
            return res.status(404).json({ message: "Publicación no encontrada" })
        }
        if (post.userId !== getCurrentUserId(req)) {
            return res.status(403).json({ message: "No podés editar esta publicación" })
        }

        post.postText = postText
        await post.save() // corre las validaciones del schema

        return res.status(200).json(post)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error interno" })
    }
}

const getPosts = async (req, res) => {
    try {
        const currentUserId = getCurrentUserId(req)

        const posts = await Post.find({ eliminated: false }).sort({ createdAt: -1 }).lean()

        // Una sola consulta SQL para todos los autores (en vez de una por post)
        const ids = [...new Set(posts.map(p => p.userId))]
        const users = await User.findAll({
            where: { userId: ids },
            attributes: ['userId', 'username', 'profilePhoto'],
            raw: true
        })
        const usersById = new Map(users.map(u => [u.userId, u]))

        const postsWithUser = posts.map(post => {
            const user = usersById.get(post.userId)
            return {
                ...post,
                author: user ? user.username : 'Usuario desconocido',
                profilePhoto: user ? user.profilePhoto : '',
                isOwner: post.userId === currentUserId
            }
        })

        return res.status(200).json(postsWithUser)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error al obtener las publicaciones", error: error.message })
    }

}

module.exports = {
    createPost,
    deletePost,
    updatePost,
    getPosts
}