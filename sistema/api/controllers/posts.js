const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const Post = require("../models/Post")
const Like = require("../models/Like")
const { User } = require("../models/User")
const { getFriendIds } = require("../services/friendsService")
const { notifyFriendsOfPost, removeNotifications } = require("../services/notificationsService")

const UPLOADS_POST_DIR = path.join(__dirname, "..", "uploads", "posts")
const MAX_IMAGES = 10
const MAX_VIDEOS = 5

const toUrls = (files = []) => files.map(f => `/uploads/posts/${f.filename}`)
const getCurrentUserId = (req) => req.user.userId || req.user.id
const isValidId = (id) => mongoose.isValidObjectId(id)

// URLs de los archivos que multer acaba de guardar en esta request
const uploadedUrls = (req) => [...toUrls(req.files?.image), ...toUrls(req.files?.videos)]

// Borra archivos del disco (solo dentro de /uploads/posts, nunca fuera)
const removeUploadedFiles = (urls = []) => {
    urls.forEach((url) => {
        if (typeof url !== 'string' || !url.startsWith('/uploads/posts/')) return
        const file = path.join(UPLOADS_POST_DIR, path.basename(url))
        fs.unlink(file, (err) => {
            if (err && err.code !== 'ENOENT') console.error('No se pudo borrar', file, err.message)
        })
    })
}

// Los listados llegan como JSON string en el FormData; si no vienen, se usa el valor por defecto
const parseList = (value, fallback) => {
    if (value === undefined) return fallback
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : fallback
    } catch {
        return fallback
    }
}

/**
 * Completa cada post (objeto plano) con los datos que viven en otras bases:
 *   author / profilePhoto -> SQL (una sola consulta para todos los autores)
 *   liked                 -> Mongo (si el usuario actual le dio like)
 *   isOwner               -> si el post es del usuario actual
 */
const decoratePosts = async (posts, currentUserId) => {
    if (posts.length === 0) return []

    const userIds = [...new Set(posts.map(p => p.userId))]
    const postIds = posts.map(p => p._id)

    const [users, likes] = await Promise.all([
        User.findAll({
            where: { userId: userIds },
            attributes: ['userId', 'username', 'profilePhoto'],
            raw: true
        }),
        Like.find({ userId: currentUserId, postId: { $in: postIds } }).select('postId').lean()
    ])

    const usersById = new Map(users.map(u => [u.userId, u]))
    const likedIds = new Set(likes.map(l => String(l.postId)))

    return posts.map(post => {
        const user = usersById.get(post.userId)
        return {
            ...post,
            author: user ? user.username : 'Usuario desconocido',
            profilePhoto: user ? user.profilePhoto : '',
            isOwner: post.userId === currentUserId,
            liked: likedIds.has(String(post._id))
        }
    })
}

/**
 * Crea un post. Si viene `parentId` es una respuesta (comentario) a ese post:
 * es un post más, con texto/imágenes/videos, que apunta al original.
 */
const createPost = async (req, res) => {
    try {
        const userId = getCurrentUserId(req)
        const postText = (req.body.postText || '').trim()
        const image = toUrls(req.files?.image)
        const videos = toUrls(req.files?.videos)
        const parentId = req.body.parentId || null

        if (!postText && image.length === 0 && videos.length === 0) {
            return res.status(400).json({ message: "La publicación no puede estar vacía" })
        }

        if (parentId) {
            if (!isValidId(parentId)) {
                removeUploadedFiles(uploadedUrls(req))
                return res.status(400).json({ message: "Publicación a responder inválida" })
            }
            const parentExists = await Post.exists({ _id: parentId, eliminated: false })
            if (!parentExists) {
                removeUploadedFiles(uploadedUrls(req))
                return res.status(404).json({ message: "La publicación que querés responder no existe" })
            }
        }

        const post = await Post.create({
            userId, postText, image, videos, parentId, eliminated: false
        })

        if (parentId) {
            await Post.updateOne({ _id: parentId }, { $inc: { commentsCount: 1 } })
        }

        // Un post nuevo (no una respuesta) les genera una notificación a los amigos del autor
        if (!parentId) {
            notifyFriendsOfPost(post, userId) // no se espera: nunca falla la publicación por esto
        }

        const [decorated] = await decoratePosts([post.toObject()], userId)
        return res.status(201).json(decorated)
    } catch (error) {
        console.error(error)
        removeUploadedFiles(uploadedUrls(req))
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

        // Si era una respuesta, el post original tiene un comentario menos
        if (post.parentId) {
            await Post.updateOne(
                { _id: post.parentId, commentsCount: { $gt: 0 } },
                { $inc: { commentsCount: -1 } }
            )
        }

        // Si se elimina el post, las notificaciones que apuntaban a él ya no tienen a dónde llevar
        await removeNotifications({ type: "friend_post", postId: String(post._id) })

        return res.status(200).json({ message: "Publicación eliminada correctamente" })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error interno del servidor" })
    }
}

/**
 * Edita texto y multimedia de un post (multipart/form-data):
 *   postText   -> nuevo texto
 *   keepImages -> JSON con las imágenes actuales que se conservan
 *   keepVideos -> JSON con los videos actuales que se conservan
 *   image      -> archivos de imagen nuevos
 *   videos     -> archivos de video nuevos
 * Lo que no esté en keepImages/keepVideos se elimina del post y del disco.
 */
const updatePost = async (req, res) => {
    const newFiles = uploadedUrls(req)

    try {
        const post = await Post.findOne({ _id: req.params.id, eliminated: false })

        if (!post) {
            removeUploadedFiles(newFiles)
            return res.status(404).json({ message: "Publicación no encontrada" })
        }
        if (post.userId !== getCurrentUserId(req)) {
            removeUploadedFiles(newFiles)
            return res.status(403).json({ message: "No podés editar esta publicación" })
        }

        const currentImages = [...post.image]
        const currentVideos = [...post.videos]

        const postText = req.body.postText !== undefined
            ? String(req.body.postText).trim()
            : (post.postText || '')

        // Solo se pueden conservar archivos que el post ya tenía
        const keepImages = parseList(req.body.keepImages, currentImages).filter(u => currentImages.includes(u))
        const keepVideos = parseList(req.body.keepVideos, currentVideos).filter(u => currentVideos.includes(u))

        const image = [...keepImages, ...toUrls(req.files?.image)]
        const videos = [...keepVideos, ...toUrls(req.files?.videos)]

        if (!postText && image.length === 0 && videos.length === 0) {
            removeUploadedFiles(newFiles)
            return res.status(400).json({ message: "La publicación no puede quedar vacía" })
        }
        if (image.length > MAX_IMAGES || videos.length > MAX_VIDEOS) {
            removeUploadedFiles(newFiles)
            return res.status(400).json({
                message: `Máximo ${MAX_IMAGES} imágenes y ${MAX_VIDEOS} videos por publicación`
            })
        }

        const removed = [
            ...currentImages.filter(u => !image.includes(u)),
            ...currentVideos.filter(u => !videos.includes(u))
        ]

        post.postText = postText
        post.image = image
        post.videos = videos
        await post.save() // corre las validaciones del schema

        removeUploadedFiles(removed)

        return res.status(200).json(post)
    } catch (error) {
        console.error(error)
        removeUploadedFiles(newFiles)
        return res.status(500).json({ message: "Error interno" })
    }
}

// Feed: solo posts "raíz" (las respuestas se ven dentro de cada post)
const getPosts = async (req, res) => {
    try {
        const currentUserId = getCurrentUserId(req)

        // El feed muestra tus publicaciones y las de tus amigos
        const friendIds = await getFriendIds(currentUserId)
        const authorIds = [currentUserId, ...friendIds]

        // parentId: null también matchea los posts viejos que no tienen ese campo
        const posts = await Post.find({ eliminated: false, parentId: null, userId: { $in: authorIds } })
            .sort({ createdAt: -1 })
            .lean()

        return res.status(200).json(await decoratePosts(posts, currentUserId))
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error al obtener las publicaciones", error: error.message })
    }
}

// Un post puntual (es lo que abre el link compartido /post/:id)
const getPostById = async (req, res) => {
    try {
        const { id } = req.params
        if (!isValidId(id)) {
            return res.status(404).json({ message: "Publicación no encontrada" })
        }

        const post = await Post.findOne({ _id: id, eliminated: false }).lean()
        if (!post) {
            return res.status(404).json({ message: "Publicación no encontrada" })
        }

        const [decorated] = await decoratePosts([post], getCurrentUserId(req))
        return res.status(200).json(decorated)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error al obtener la publicación" })
    }
}

// Respuestas (comentarios) de un post, las más nuevas primero
const getReplies = async (req, res) => {
    try {
        const { id } = req.params
        if (!isValidId(id)) {
            return res.status(404).json({ message: "Publicación no encontrada" })
        }

        const replies = await Post.find({ parentId: id, eliminated: false })
            .sort({ createdAt: -1 })
            .lean()

        return res.status(200).json(await decoratePosts(replies, getCurrentUserId(req)))
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error al obtener las respuestas" })
    }
}

// Like / quitar like. Devuelve { liked, likesCount } ya actualizados
const toggleLike = async (req, res) => {
    try {
        const { id } = req.params
        const userId = getCurrentUserId(req)

        if (!isValidId(id) || !(await Post.exists({ _id: id, eliminated: false }))) {
            return res.status(404).json({ message: "Publicación no encontrada" })
        }

        let liked
        const removed = await Like.findOneAndDelete({ postId: id, userId })

        if (removed) {
            liked = false
        } else {
            try {
                await Like.create({ postId: id, userId })
            } catch (err) {
                // 11000 = índice único: otra request ya había creado el like
                if (err.code !== 11000) throw err
            }
            liked = true
        }

        // El contador se recalcula desde los likes reales, así nunca se desincroniza
        const likesCount = await Like.countDocuments({ postId: id })
        await Post.updateOne({ _id: id }, { $set: { likesCount } })

        return res.status(200).json({ liked, likesCount })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Error al procesar el like" })
    }
}



// Cuenta las publicaciones del usuario autenticado
const getMyPostsCount = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);

        if (!userId) {
            return res.status(401).json({
                message: "Usuario no autenticado"
            });
        }

        const totalPosts = await Post.countDocuments({
            userId,
            eliminated: false
        });

        return res.status(200).json({
            totalPosts
        });

    } catch (error) {
        console.error("Error al contar las publicaciones:", error);

        return res.status(500).json({
            message: "Error al contar las publicaciones"
        });
    }
};





/**
 * Perfil: publicaciones originales del usuario autenticado.
 */
const getMyProfilePosts = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);

        if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }

        const posts = await Post.find({
            userId,
            parentId: null,
            eliminated: false
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(
            await decoratePosts(posts, userId)
        );
    } catch (error) {
        console.error("Error al obtener los posts del perfil:", error);
        return res.status(500).json({
            message: "Error al obtener las publicaciones del perfil"
        });
    }
};

/**
 * Perfil: todos los comentarios y respuestas del usuario.
 */
const getMyProfileReplies = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);

        if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }

        const replies = await Post.find({
            userId,
            parentId: { $ne: null },
            eliminated: false
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(
            await decoratePosts(replies, userId)
        );
    } catch (error) {
        console.error("Error al obtener las replies del perfil:", error);
        return res.status(500).json({
            message: "Error al obtener las respuestas del perfil"
        });
    }
};

/**
 * Perfil: todos los posts y respuestas a los que dio like.
 * Se ordenan según la fecha en que el usuario dio like.
 */
const getMyProfileLikes = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);

        if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }

        // Obtener todos los likes del usuario, del más reciente al más antiguo.
        const likes = await Like.find({ userId })
            .sort({ createdAt: -1 })
            .select("postId")
            .lean();

        if (likes.length === 0) {
            return res.status(200).json([]);
        }

        const postIds = likes.map(like => like.postId);

        // Buscar solamente publicaciones que sigan existiendo y no estén eliminadas.
        const posts = await Post.find({
            _id: { $in: postIds },
            eliminated: false
        }).lean();

        // Mantener el orden de los likes, no el orden arbitrario de MongoDB.
        const postsById = new Map(
            posts.map(post => [String(post._id), post])
        );

        const orderedPosts = postIds
            .map(id => postsById.get(String(id)))
            .filter(Boolean);

        return res.status(200).json(
            await decoratePosts(orderedPosts, userId)
        );
    } catch (error) {
        console.error("Error al obtener los likes del perfil:", error);
        return res.status(500).json({
            message: "Error al obtener los likes del perfil"
        });
    }
};




/**
 * Perfil público: publicaciones originales de otro usuario.
 */
const getUserProfilePosts = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const currentUserId = getCurrentUserId(req);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "El ID del usuario no es válido"
            });
        }

        // Verificar que el usuario exista y no esté eliminado.
        const user = await User.findOne({
            where: {
                userId,
                eliminated: 0
            },
            attributes: ["userId"],
            raw: true
        });

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        const posts = await Post.find({
            userId,
            parentId: null,
            eliminated: false
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(
            await decoratePosts(posts, currentUserId)
        );
    } catch (error) {
        console.error("Error al obtener las publicaciones del usuario:", error);

        return res.status(500).json({
            message: "Error al obtener las publicaciones del usuario"
        });
    }
};

/**
 * Perfil público: comentarios y respuestas publicados por otro usuario.
 */
const getUserProfileReplies = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const currentUserId = getCurrentUserId(req);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "El ID del usuario no es válido"
            });
        }

        const user = await User.findOne({
            where: {
                userId,
                eliminated: 0
            },
            attributes: ["userId"],
            raw: true
        });

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        const replies = await Post.find({
            userId,
            parentId: { $ne: null },
            eliminated: false
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(
            await decoratePosts(replies, currentUserId)
        );
    } catch (error) {
        console.error("Error al obtener las respuestas del usuario:", error);

        return res.status(500).json({
            message: "Error al obtener las respuestas del usuario"
        });
    }
};

/**
 * Perfil público: publicaciones y respuestas a las que otro usuario
 * les dio like. Se conserva el orden cronológico de los likes.
 */
const getUserProfileLikes = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const currentUserId = getCurrentUserId(req);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "El ID del usuario no es válido"
            });
        }

        const user = await User.findOne({
            where: {
                userId,
                eliminated: 0
            },
            attributes: ["userId"],
            raw: true
        });

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        const likes = await Like.find({ userId })
            .sort({ createdAt: -1 })
            .select("postId")
            .lean();

        if (likes.length === 0) {
            return res.status(200).json([]);
        }

        const postIds = likes.map(like => like.postId);

        const posts = await Post.find({
            _id: { $in: postIds },
            eliminated: false
        }).lean();

        // MongoDB no garantiza que $in respete el orden de postIds.
        const postsById = new Map(
            posts.map(post => [String(post._id), post])
        );

        const orderedPosts = postIds
            .map(id => postsById.get(String(id)))
            .filter(Boolean);

        return res.status(200).json(
            await decoratePosts(orderedPosts, currentUserId)
        );
    } catch (error) {
        console.error("Error al obtener los likes del usuario:", error);

        return res.status(500).json({
            message: "Error al obtener los likes del usuario"
        });
    }
};




module.exports = {
    createPost,
    deletePost,
    updatePost,
    getPosts,
    getPostById,
    getReplies,
    toggleLike,
    getMyPostsCount,
    getMyProfilePosts,
    getMyProfileReplies,
    getMyProfileLikes,
    getUserProfilePosts,
    getUserProfileReplies,
    getUserProfileLikes, 
}