// Servidor de PRUEBA: usa tus archivos reales (users, messages, uploads, auth, upload, chat)
// pero con SQLite y solo las rutas necesarias para la mensajeria.
const express = require("express");
const http = require("http");
const path = require("path");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");

const upload = require("./middlewares/upload");
const { uploadFile } = require("./controllers/uploads");
const { Login, Register } = require("./controllers/users");
const { checkToken } = require("./middlewares/auth");
const {
  getMessages,
  getConversations,
  getUserById,
  markAsRead,
  searchUsers
} = require("./controllers/messages");
const setupChat = require("./sockets/chat");
const sequelize = require("./config/db");
const Role = require("./models/Role");
const { User } = require("./models/User");

const server = express();
const httpServer = http.createServer(server);

const PORT = 3000;
const CLIENT_URL = "http://localhost:5173";

server.use(express.json());

server.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"], credentials: true }
});

server.post("/login", Login);
server.post("/register", Register);

server.get("/conversations", checkToken, getConversations);
server.get("/users/search", checkToken, searchUsers); // antes de /users/:id
server.get("/users/:id", checkToken, getUserById);
server.get("/messages/:otherUserId", checkToken, getMessages);
server.put("/messages/read/:otherUserId", checkToken, markAsRead);

server.post("/Upload", checkToken, upload.single("file"), uploadFile);
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

// markAsRead usa io para avisar "Visto" al emisor en tiempo real
server.set("io", io);
setupChat(io);

const start = async () => {
  await sequelize.sync();

  // Datos de prueba
  await Role.findOrCreate({ where: { idRole: 1 }, defaults: { name: "user" } });

  const password = await bcrypt.hash("1234", 10);
  for (const username of ["ana", "beto", "carla"]) {
    await User.findOrCreate({
      where: { username },
      defaults: {
        email: `${username}@test.com`,
        password,
        description: "Usuario de prueba",
        birthDate: new Date("2000-01-01"),
        gender: "Otro",
        DVH: "0".repeat(64),
        idRole: 1,
        eliminated: 0,
        followerAmount: 0,
        followingAmount: 0,
        profilePhoto: "default.png",
        banner: "vacio",
        friendId: 2,
        ubication: "Buenos Aires",
        penaltyDate: "nada"
      }
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Usuarios de prueba: ana, beto, carla (password: 1234)");
  });
};

start().catch((err) => {
  console.error("No se pudo iniciar el servidor:", err);
  process.exit(1);
});
