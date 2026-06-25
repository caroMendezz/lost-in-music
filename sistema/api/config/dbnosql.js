const mongoose = require("mongoose")

const connectDB = async () => {

    try {

        await mongoose.connect("mongodb://localhost:27017/")

        console.log("MongoDB conectado")

    } catch (error) {

        console.log(error)

    }

}

module.exports = connectDB