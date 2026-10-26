const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const dir = path.join(__dirname, "..", "uploads", "posts");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ok =
    (file.fieldname === "image" && file.mimetype.startsWith("image/")) ||
    (file.fieldname === "videos" && file.mimetype.startsWith("video/"));
  cb(ok ? null : new Error("Tipo de archivo no permitido"), ok);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 15 },
}).fields([
  { name: "image", maxCount: 10 },
  { name: "videos", maxCount: 5 },
]);

// Envuelto para devolver JSON en vez de una página de error HTML
module.exports = (req, res, next) =>
  uploader(req, res, (err) =>
    err ? res.status(400).json({ message: err.message }) : next()
  );