const mongoose = require("mongoose")

const connectDB = async () => {

    try {

        const mongoUrl =
        process.env.NODE_ENV === "production"
            ? process.env.MONGO_URL
            : process.env.MONGO_LOCAL_URL;

        await mongoose.connect(mongoUrl);

        console.log("MongoDB conectado")

    } catch (error) {

        console.log(error)

    }

}

module.exports = connectDB