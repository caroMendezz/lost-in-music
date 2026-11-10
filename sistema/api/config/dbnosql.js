const mongoose = require("mongoose")

const connectDB = async () => {

    try {

        const mongoUrl =process.env.MONGO_URL


        await mongoose.connect(mongoUrl);

        console.log("MongoDB conectado")

    } catch (error) {

        console.log(error)

    }

}

module.exports = connectDB