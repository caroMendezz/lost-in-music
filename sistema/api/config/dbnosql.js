const mongoose = require("mongoose")

const connectDB = async () => {

    try {

        await mongoose.connect("mongodb://admin:admin123@localhost:27018/")

        console.log("MongoDB conectado")

    } catch (error) {

        console.log(error)

    }

}

module.exports = connectDB