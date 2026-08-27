const Post = require("../models/Product")
const {User} = require("../models/User")

const createProduct = async (req, res) => {

    try {

        const { userId, title, image, description, category, condition, price, location } = req.body

        const user = await User.findByPk(userId)

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }

        const product = await Product.create({
            userId,
            title,
            image,
            description,
            category,
            condition,
            location,
            price
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


const deleteProduct = async (req, res) => {

    try {
        productId = _id
        const { productId } = req.params

        const product = await Product.findById(id)

        if (!product) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            })
        }

        if (product.eliminated) {
            return res.status(400).json({
                message: "La publicación ya está eliminada"
            })
        }

        prodcut.eliminated = true

        await product.save()

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

const updateProduct = async (req, res) => {

    try {

        const { productId } = req.params

        const {
            title,
            image,
            description,
            price,
            category,
            location
        } = req.body

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

        if (!product) {
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
    createProduct,
    deleteProduct,
    updateProduct
}