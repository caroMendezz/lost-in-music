const Post = require("../models/Post")
const { User } = require("../models/User")

const createPost = async (req, res) => {
    try {
        // Obtenemos el userId directamente desde el usuario autenticado por 'checkToken'
        // (Dependiendo de cómo esté definido tu modelo Sequelize, el ID puede ser .userId o .id)
        const userId = req.user.userId || req.user.id; 
        const { postText, image, videos } = req.body;

        // Como 'checkToken' ya validó que el usuario existe en la base de datos, 
        // podemos proceder a crear el post en la base de datos NoSQL directamente.
        const post = await Post.create({
            userId,
            postText,
            image,
            videos,
            eliminated: false
        });

        return res.status(201).json(post);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error interno",
            error: error.message
        });
    }
}

const deletePost = async (req, res) => {
    try {
        const postId = req.params.id

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({
                message: "Publicación no encontrada", postId
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
        const { postText, image, videos } = req.body

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
                postId: postId,
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

const getPosts = async (req, res) => {
    try {
        // Obtenemos los posts de MongoDB que no estén eliminados
        const posts = await Post.find({ eliminated: false }).lean().sort({ createdAt: -1 });

        // Unimos cada post con los datos del usuario correspondiente en Sequelize (MySQL)
        const postsWithUser = await Promise.all(posts.map(async (post) => {
            const user = await User.findByPk(post.userId);
            
            return {
                ...post,
                author: user ? user.username : 'Usuario desconocido',
                profilePhoto: user ? user.profilePhoto : ''
            };
        }));

        return res.status(200).json(postsWithUser);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error al obtener las publicaciones",
            error: error.message
        });
    }
};

module.exports = {
    createPost,
    deletePost,
    updatePost,
    getPosts
}