const uploadFile = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                message: "No file uploaded"
            });

        }


        return res.status(201).json({

            message: "File uploaded successfully",

            file: {
                originalName: req.file.originalname,
                fileName: req.file.filename,
                fileUrl: `/uploads/${req.file.filename}`,
                mimeType: req.file.mimetype,
                size: req.file.size
            }

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });

    }

};


module.exports = {
    uploadFile
};
