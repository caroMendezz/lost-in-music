const mongoose = require("mongoose")
const Product = require("../models/Product")
const {User} = require("../models/User")

// Mismos valores que el enum de models/Product.js
const PRODUCT_CATEGORIES = ["Cuerda", "Viento", "Percusion", "Electronicos", "Complementos"]
const PRODUCT_CONDITIONS = ["Nuevo", "Usado"]
const MAX_IMAGES = 10

// Normaliza las fotos que llegan del formulario: array de rutas no vacías, sin repetir el tope.
const normalizeImages = (image) => {
    const list = Array.isArray(image) ? image : [image]

    return list
        .filter((url) => typeof url === "string" && url.trim())
        .map((url) => url.trim())
        .slice(0, MAX_IMAGES)
}

const createProduct = async (req, res) => {

    try {

        const {
            userId,
            title,
            image,
            description,
            category,
            subcategory,
            condition,
            price,
            location,
            available
        } = req.body

        // El dueño de la publicación sale del token (checkToken) y no del body
        const ownerId = req.user?.userId ?? userId

        if (!ownerId) {
            return res.status(400).json({
                message: "Falta el usuario que publica"
            })
        }

        if (!title || !String(title).trim()) {
            return res.status(400).json({
                message: "El título es obligatorio"
            })
        }

        if (price === undefined || price === null || String(price).trim() === "") {
            return res.status(400).json({
                message: "El precio es obligatorio"
            })
        }

        if (!category || (Array.isArray(category) && category.length === 0)) {
            return res.status(400).json({
                message: "La categoría es obligatoria"
            })
        }

        if (!condition || (Array.isArray(condition) && condition.length === 0)) {
            return res.status(400).json({
                message: "El estado del producto es obligatorio"
            })
        }

        const user = await User.findByPk(ownerId)

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }

        const product = await Product.create({
            userId: ownerId,
            title: String(title).trim(),
            image,
            description,
            category,
            subcategory,
            condition,
            price,
            location,
            ...(available !== undefined ? { available } : {})
        })

        return res.status(201).json({
            ...product.toObject(),
            seller: {
                userId: user.userId,
                username: user.username,
                profilePhoto: user.profilePhoto || null
            }
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Error interno",
            error: error.message
        })

    }

}

// Publicaciones activas para Shop in vivo, de la más nueva a la más vieja.
// Cada una incluye los datos del vendedor para la tarjeta y el detalle.
const getProducts = async (req, res) => {

    try {

        const products = await Product.find({ eliminated: false })
            .sort({ createdAt: -1 })
            .lean()

        const ownerIds = [
            ...new Set(
                products
                    .map((product) => Number(product.userId))
                    .filter((id) => Number.isInteger(id))
            )
        ]

        const users = ownerIds.length
            ? await User.findAll({ where: { userId: ownerIds } })
            : []

        const usersById = new Map(users.map((user) => [Number(user.userId), user]))

        return res.status(200).json(
            products.map((product) => {
                const seller = usersById.get(Number(product.userId))

                return {
                    ...product,
                    seller: seller
                        ? {
                            userId: seller.userId,
                            username: seller.username,
                            profilePhoto: seller.profilePhoto || null
                        }
                        : null
                }
            })
        )

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Error interno",
            error: error.message
        })

    }

}


// PATCH /DeleteProduct/:id
// La baja es lógica (eliminated = true) y solo puede hacerla el dueño.
const deleteProduct = async (req, res) => {

    try {

        const productId = req.params.id

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                message: "El identificador de la publicación no es válido"
            })
        }

        const product = await Product.findById(productId)

        if (!product || product.eliminated) {
            return res.status(404).json({
                message: "Publicación del producto no encontrada"
            })
        }

        if (Number(product.userId) !== Number(req.user.userId)) {
            return res.status(403).json({
                message: "No podés eliminar una publicación que no es tuya"
            })
        }

        product.eliminated = true

        await product.save()

        return res.status(200).json({
            message: "Publicación del producto eliminada correctamente",
            id: String(product._id)
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Error interno del servidor"
        })

    }

}

// PATCH /UpdateProduct/:id
// Solo el dueño de la publicación puede editarla. Se pueden cambiar título, fotos,
// descripción, precio, localidad, categoría, subcategoría y estado.
const updateProduct = async (req, res) => {

    try {

        const productId = req.params.id

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                message: "Identificador de publicación inválido"
            })
        }

        const product = await Product.findOne({
            _id: productId,
            eliminated: false
        })

        if (!product) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            })
        }

        const userId = req.user?.userId

        if (userId === undefined || userId === null || Number(product.userId) !== Number(userId)) {
            return res.status(403).json({
                message: "Solo el dueño de la publicación puede editarla"
            })
        }

        const {
            title,
            image,
            description,
            price,
            category,
            subcategory,
            condition,
            location,
            available
        } = req.body

        const dataUpdate = {}

        if (title !== undefined) {
            if (!String(title).trim()) {
                return res.status(400).json({
                    message: "El título es obligatorio"
                })
            }

            dataUpdate.title = String(title).trim()
        }

        if (image !== undefined) {
            const images = normalizeImages(image)

            if (images.length === 0) {
                return res.status(400).json({
                    message: "La publicación necesita al menos una foto"
                })
            }

            dataUpdate.image = images
        }

        if (description !== undefined) {
            dataUpdate.description = String(description)
        }

        if (price !== undefined) {
            if (price === null || String(price).trim() === "") {
                return res.status(400).json({
                    message: "El precio es obligatorio"
                })
            }

            dataUpdate.price = String(price).trim()
        }

        if (category !== undefined) {
            if (!PRODUCT_CATEGORIES.includes(category)) {
                return res.status(400).json({
                    message: "Categoría inválida"
                })
            }

            dataUpdate.category = category
        }

        if (subcategory !== undefined) {
            dataUpdate.subcategory = String(subcategory).trim()
        }

        if (condition !== undefined) {
            if (!PRODUCT_CONDITIONS.includes(condition)) {
                return res.status(400).json({
                    message: "Estado del producto inválido"
                })
            }

            dataUpdate.condition = condition
        }

        if (location !== undefined) {
            dataUpdate.location = String(location).trim()
        }

        if (available !== undefined) {
            dataUpdate.available = Boolean(available)
        }

        if (Object.keys(dataUpdate).length === 0) {
            return res.status(400).json({
                message: "No se enviaron datos para actualizar"
            })
        }

        Object.assign(product, dataUpdate)

        await product.save()

        const seller = await User.findByPk(product.userId)

        return res.status(200).json({
            ...product.toObject(),
            seller: seller
                ? {
                    userId: seller.userId,
                    username: seller.username,
                    profilePhoto: seller.profilePhoto || null
                }
                : null
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Error interno",
            error: error.message
        })

    }

}


module.exports = {
    createProduct,
    getProducts,
    deleteProduct,
    updateProduct
}