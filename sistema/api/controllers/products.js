const Product = require("../models/Product")
const {User} = require("../models/User")

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


const deleteProduct = async (req, res) => {

    try {

        const productId = req.params.id


        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({
                message: "Publicación del producto no encontrada"
            })
        }

        if (product.eliminated) {
            return res.status(400).json({
                message: "La publicación del producto ya está eliminada"
            })
        }

        product.eliminated = true

        await product.save()

        return res.status(200).json({
            message: "Publicación del producto eliminada correctamente"
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Error interno del servidor"
        })

    }

}

const updateProduct = async (req, res) => {

    try {
        console.log("1. req.params completos:", req.params);
        const productId  = req.params.id
        console.log("2. ID capturado:", productId);
        const {
            title,
            image,
            description,
            price,
            category,
            location
        } = req.body
        console.log("3. Body recibido:", req.body);
        const dataUpdate = {}

        if (title !== undefined)
            dataUpdate.title = title
        if (image !== undefined)
            dataUpdate.image = image

        if (description !== undefined)
            dataUpdate.description = description

        if (price !== undefined)
            dataUpdate.price = price

        if (category !== undefined)
            dataUpdate.category = category

        if (location !== undefined)
            dataUpdate.location = location

        if (Object.keys(dataUpdate).length === 0) {
            return res.status(400).json({
                message: "No se enviaron datos para actualizar"
            })
        }
        console.log("4. Datos a actualizar:", dataUpdate);

        const product = await Product.findOneAndUpdate(
            {
                _id: productId,
                eliminated: false
            },
            dataUpdate,
            {
                new: true,
                runValidators: true
            }
        )
        console.log("5. Resultado de la base de datos:", product);
        if (!product) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            })
        }

        res.status(200).json(product)

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Error interno"
        })

    }

}


module.exports = {
    createProduct,
    getProducts,
    deleteProduct,
    updateProduct
}