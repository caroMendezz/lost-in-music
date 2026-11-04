
require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

// =====================================================
// CONTROLADORES DE AUTENTICACIÓN Y USUARIOS
// =====================================================

const {
  RequestEmailChange,
  ConfirmEmailChange,
} = require("./controllers/changeEmail");

const {
  RequestPasswordChange,
  ConfirmPasswordChange,
} = require("./controllers/changePassword");

const {
  Login,
  Register,
  DeleteUser,
  UpdateUser,
  GetSession,
  GetMyProfile,
  UpdateMyProfile,
  GetUserProfile,
} = require("./controllers/users");

// =====================================================
// MIDDLEWARES
// =====================================================

const upload = require("./middlewares/upload");
const uploadPostMedia = require("./middlewares/uploadPostMedia");
const auditLog = require("./middlewares/auditLog");

const { isAdmin } = require("./middlewares/isAdmin");
const { checkToken, checkAdmin } = require("./middlewares/auth");

// =====================================================
// CONTROLADORES
// =====================================================

const { uploadFile } = require("./controllers/uploads");

const {
  listUsers,
  banUser,
  unbanUser,
  adminDeletePost,
} = require("./controllers/admin");

const {
  createPost,
  deletePost,
  updatePost,
  getPosts,
  getPostById,
  getReplies,
  toggleLike,
  getMyPostsCount,
  getMyProfilePosts,
  getMyProfileReplies,
  getMyProfileLikes,
  getUserProfilePosts,
  getUserProfileReplies,
  getUserProfileLikes,
} = require("./controllers/posts");

const { createRole } = require("./controllers/roles");

const {
  SendVerificationCode,
  CheckVerificationCode,
} = require("./controllers/verify");

const {
  getMessages,
  getConversations,
  deleteConversationForUser,
  getUserById,
  markAsRead,
  searchUsers,
} = require("./controllers/messages");

const {
  createProduct,
  getProducts,
  deleteProduct,
  updateProduct,
} = require("./controllers/products");

const {
  getFriends,
  getFriendRequests,
  searchPeople,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  getUserFriends,
} = require("./controllers/friends");

const {
  getNotifications,
  markNotificationsRead,
  deleteNotification,
  clearNotifications,
} = require("./controllers/notifications");

const {
  createReport,
  listReports,
  getReportsCount,
  updateReportStatus,
} = require("./controllers/reports");

// =====================================================
// SOCKETS
// =====================================================

const setupChat = require("./sockets/chat");
const { setupPresence } = require("./sockets/presence");
const { setupAccount } = require("./sockets/account");

// =====================================================
// CONFIGURACIÓN DE BASE DE DATOS
// =====================================================

const sequelize = require("./config/db");

const {
  ensureMessagesColumns,
  ensureUsersColumns,
} = require("./config/migrations");

const connectDB = require("./config/dbnosql");

// =====================================================
// CONFIGURACIÓN DEL SERVIDOR
// =====================================================

const server = express();

const httpServer = http.createServer(server);

const PORT = 3000;
const CLIENT_URL = "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// =====================================================
// MIDDLEWARES GLOBALES
// =====================================================

server.use(express.json({ limit: "10mb" }));

server.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Bitácora: registra todas las interacciones que no sean GET.
server.use(auditLog);

// =====================================================
// AUTENTICACIÓN Y REGISTRO
// =====================================================

server.post("/CreateRole", createRole);

server.post("/login", Login);
server.post("/register", Register);

// Obtener información de la sesión.
server.get("/session", checkToken, GetSession);

// =====================================================
// PERFIL DEL USUARIO
// =====================================================

server.get("/myProfile", checkToken, GetMyProfile);

server.patch("/myProfile", checkToken, UpdateMyProfile);

server.get("/users/:id", checkToken, GetUserProfile);

server.patch("/deleteUser/:id", checkToken, DeleteUser);

server.patch("/updateUser/:id", checkToken, UpdateUser);

// =====================================================
// CAMBIO DE CORREO ELECTRÓNICO
// =====================================================

server.post(
  "/email/change/request",
  checkToken,
  RequestEmailChange
);

server.post(
  "/email/change/confirm",
  checkToken,
  ConfirmEmailChange
);

// =====================================================
// CAMBIO DE CONTRASEÑA
// =====================================================

server.post(
  "/password/change/request",
  checkToken,
  RequestPasswordChange
);

server.post(
  "/password/change/confirm",
  checkToken,
  ConfirmPasswordChange
);

// =====================================================
// ADMINISTRACIÓN DE USUARIOS Y SANCIONES
// =====================================================

// Listado y búsqueda de usuarios.
server.get(
  "/admin/users",
  checkToken,
  checkAdmin,
  listUsers
);

// Sancionar y levantar sanciones.
server.patch(
  "/admin/users/:id/ban",
  checkToken,
  checkAdmin,
  banUser
);

server.delete(
  "/admin/users/:id/ban",
  checkToken,
  checkAdmin,
  unbanUser
);

// Rutas de administración originales.
server.patch(
  "/admin/ban/:userId",
  checkToken,
  isAdmin,
  banUser
);

server.patch(
  "/admin/unban/:userId",
  checkToken,
  isAdmin,
  unbanUser
);

server.patch(
  "/admin/DeletePost/:id",
  checkToken,
  isAdmin,
  adminDeletePost
);

// =====================================================
// PUBLICACIONES
// =====================================================

server.post(
  "/CreatePost",
  checkToken,
  uploadPostMedia,
  createPost
);

server.patch(
  "/DeletePost/:id",
  checkToken,
  deletePost
);

server.patch(
  "/UpdatePost/:id",
  checkToken,
  uploadPostMedia,
  updatePost
);

server.get("/GetPost", checkToken, getPosts);

server.get("/GetPost/:id", checkToken, getPostById);

server.get("/GetReplies/:id", checkToken, getReplies);

server.post("/LikePost/:id", checkToken, toggleLike);

// =====================================================
// PUBLICACIONES DEL PERFIL PROPIO
// =====================================================

server.get(
  "/posts/my/count",
  checkToken,
  getMyPostsCount
);

server.get(
  "/posts/my/profile",
  checkToken,
  getMyProfilePosts
);

server.get(
  "/posts/my/replies",
  checkToken,
  getMyProfileReplies
);

server.get(
  "/posts/my/likes",
  checkToken,
  getMyProfileLikes
);

// =====================================================
// PUBLICACIONES DE OTROS USUARIOS
// =====================================================

server.get(
  "/posts/user/:userId/profile",
  checkToken,
  getUserProfilePosts
);

server.get(
  "/posts/user/:userId/replies",
  checkToken,
  getUserProfileReplies
);

server.get(
  "/posts/user/:userId/likes",
  checkToken,
  getUserProfileLikes
);

// =====================================================
// PRODUCTOS
// =====================================================

server.post("/CreateProduct", checkToken, createProduct);

server.get("/GetProduct", checkToken, getProducts);

server.patch(
  "/DeleteProduct/:id",
  checkToken,
  deleteProduct
);

server.patch(
  "/UpdateProduct/:id",
  checkToken,
  updateProduct
);

// =====================================================
// VERIFICACIÓN
// =====================================================

server.post("/verify/send", SendVerificationCode);

server.post("/verify/check", CheckVerificationCode);

// =====================================================
// MENSAJERÍA
// =====================================================

server.get(
  "/messages/:otherUserId",
  checkToken,
  getMessages
);

server.get(
  "/conversations",
  checkToken,
  getConversations
);

server.get(
  "/users/search",
  checkToken,
  searchUsers
);

server.put(
  "/messages/read/:otherUserId",
  checkToken,
  markAsRead
);

server.delete(
  "/conversations/:otherUserId",
  checkToken,
  deleteConversationForUser
);

// =====================================================
// AMISTADES
// =====================================================

server.get("/friends", checkToken, getFriends);

server.get(
  "/friends/user/:userId",
  checkToken,
  getUserFriends
);

server.get(
  "/friends/requests",
  checkToken,
  getFriendRequests
);

server.get(
  "/friends/search",
  checkToken,
  searchPeople
);

server.post(
  "/friends/request/:userId",
  checkToken,
  sendFriendRequest
);

server.patch(
  "/friends/accept/:userId",
  checkToken,
  acceptFriendRequest
);

server.delete(
  "/friends/:userId",
  checkToken,
  removeFriendship
);

// =====================================================
// NOTIFICACIONES
// =====================================================

server.get(
  "/notifications",
  checkToken,
  getNotifications
);

server.patch(
  "/notifications/read",
  checkToken,
  markNotificationsRead
);

server.delete(
  "/notifications/:id",
  checkToken,
  deleteNotification
);

server.delete(
  "/notifications",
  checkToken,
  clearNotifications
);

// =====================================================
// REPORTES
// =====================================================

// Cualquier usuario autenticado puede reportar a otro usuario o una publicación.
server.post("/reports", checkToken, createReport);

// Panel de reportes para administradores.
server.get(
  "/admin/reports",
  checkToken,
  checkAdmin,
  listReports
);

server.get(
  "/admin/reports/count",
  checkToken,
  checkAdmin,
  getReportsCount
);

server.patch(
  "/admin/reports/:id",
  checkToken,
  checkAdmin,
  updateReportStatus
);

// =====================================================
// SUBIDA DE ARCHIVOS
// =====================================================

server.post(
  "/Upload",
  checkToken,
  upload.single("file"),
  uploadFile
);

// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================

server.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Imagen predeterminada de perfil.
server.use(
  "/assets",
  express.static(path.join(__dirname, "public"))
);

// =====================================================
// CONFIGURACIÓN DE SOCKET.IO
// =====================================================

// Permite que los controladores HTTP emitan eventos por socket.
server.set("io", io);

setupChat(io);
setupPresence(io);
setupAccount(io);

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const start = async () => {
  try {
    await sequelize.sync();

    await ensureMessagesColumns();
    await ensureUsersColumns();

    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

start();
