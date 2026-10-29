require('dotenv').config()
const express = require('express')
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const {
  RequestEmailChange,
  ConfirmEmailChange,
} = require("./controllers/changeEmail");
const {
  RequestPasswordChange,
  ConfirmPasswordChange,
} = require('./controllers/changePassword');

const upload = require("./middlewares/upload");
const uploadPostMedia = require("./middlewares/uploadPostMedia");
const auditLog = require("./middlewares/auditLog");
const {uploadFile} = require("./controllers/uploads");
const { isAdmin } = require("./middlewares/isAdmin");
const { banUser, unbanUser, adminDeletePost } = require("./controllers/admin");
const {
  Login,
  Register,
  DeleteUser,
  UpdateUser,
  GetMyProfile,
  UpdateMyProfile,
  GetUserProfile,
} = require('./controllers/users')
const {createPost, deletePost, updatePost, getPosts, getPostById, getReplies, toggleLike, getMyPostsCount, getMyProfilePosts, getMyProfileReplies, getMyProfileLikes, getUserProfilePosts, getUserProfileReplies, getUserProfileLikes} = require('./controllers/posts')
const {createRole} = require('./controllers/roles')
const {SendVerificationCode, CheckVerificationCode} = require('./controllers/verify')
const {checkToken } = require('./middlewares/auth')
const {getMessages, getConversations, deleteConversationForUser, getUserById, markAsRead, searchUsers} = require('./controllers/messages')
const {createProduct, getProducts, deleteProduct, updateProduct} = require('./controllers/products')
const setupChat = require("./sockets/chat");
const { setupPresence } = require("./sockets/presence");
const {
  getFriends, getFriendRequests, searchPeople,
  sendFriendRequest, acceptFriendRequest, removeFriendship
} = require("./controllers/friends");
const {
  getNotifications, markNotificationsRead, deleteNotification, clearNotifications
} = require("./controllers/notifications");
const sequelize = require('./config/db')
const { ensureMessagesColumns, ensureUsersColumns } = require('./config/migrations')
const connectDB = require("./config/dbnosql")
const server = express()

const httpServer = http.createServer(server);

const PORT = 3000
const CLIENT_URL = "http://localhost:5173";

server.use(express.json({ limit: '10mb' }))

server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CLIENT_URL)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Bitácora (logs/bitacora.txt): registra toda interacción que no sea GET
server.use(auditLog)

const io = new Server(httpServer, {
  cors: {
      origin: CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true
  }
});

server.post('/CreateRole', createRole);

server.post('/login', Login);
server.post('/register', Register);

server.get('/myProfile', checkToken, GetMyProfile);
server.patch('/myProfile', checkToken, UpdateMyProfile);
// Cambio seguro de correo electrónico
server.post("/email/change/request",checkToken,RequestEmailChange);

server.post("/email/change/confirm",checkToken,ConfirmEmailChange);

server.post('/password/change/request',checkToken,RequestPasswordChange);

server.post('/password/change/confirm',checkToken,ConfirmPasswordChange);

server.patch('/deleteUser/:id',checkToken, DeleteUser);
server.patch('/updateUser/:id',checkToken, UpdateUser);

server.post('/CreatePost', checkToken, uploadPostMedia, createPost);
server.patch('/DeletePost/:id',checkToken, deletePost);
server.patch('/UpdatePost/:id',checkToken, uploadPostMedia, updatePost);
server.get('/GetPost', checkToken, getPosts);
server.get('/GetPost/:id', checkToken, getPostById);
server.get('/GetReplies/:id', checkToken, getReplies);
server.post('/LikePost/:id', checkToken, toggleLike); 
server.get("/posts/my/count", checkToken, getMyPostsCount);
server.get("/posts/my/profile", checkToken, getMyProfilePosts);
server.get("/posts/my/replies", checkToken, getMyProfileReplies);
server.get("/posts/my/likes", checkToken, getMyProfileLikes);
server.get("/posts/user/:userId/profile",checkToken,getUserProfilePosts);
server.get("/posts/user/:userId/replies",checkToken,getUserProfileReplies);
server.get("/posts/user/:userId/likes",checkToken,getUserProfileLikes);

// === Rutas de administración ===
server.patch("/admin/ban/:userId", checkToken, isAdmin, banUser);
server.patch("/admin/unban/:userId", checkToken, isAdmin, unbanUser);
server.patch("/admin/DeletePost/:id", checkToken, isAdmin, adminDeletePost);

server.post('/CreateProduct', checkToken, createProduct);
server.get('/GetProduct', checkToken, getProducts);
server.patch('/DeleteProduct/:id',checkToken, deleteProduct);
server.patch('/UpdateProduct/:id',checkToken, updateProduct); 

server.post('/verify/send', SendVerificationCode);
server.post('/verify/check', CheckVerificationCode);

server.get("/messages/:otherUserId", checkToken, getMessages);

server.get("/conversations", checkToken, getConversations);
server.get("/users/search", checkToken, searchUsers);
server.get("/users/:id", checkToken, GetUserProfile);
server.put("/messages/read/:otherUserId", checkToken, markAsRead);
server.delete("/conversations/:otherUserId", checkToken, deleteConversationForUser);

server.get("/friends", checkToken, getFriends);
server.get("/friends/requests", checkToken, getFriendRequests);
server.get("/friends/search", checkToken, searchPeople);
server.post("/friends/request/:userId", checkToken, sendFriendRequest);
server.patch("/friends/accept/:userId", checkToken, acceptFriendRequest);
server.delete("/friends/:userId", checkToken, removeFriendship);

server.get("/notifications", checkToken, getNotifications);
server.patch("/notifications/read", checkToken, markNotificationsRead);
server.delete("/notifications/:id", checkToken, deleteNotification);
server.delete("/notifications", checkToken, clearNotifications);

server.post("/Upload", checkToken, upload.single("file"), uploadFile);
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Permite que los controladores HTTP (por ejemplo markAsRead) emitan eventos por socket
server.set("io", io);

setupChat(io);
setupPresence(io);

const start = async () => {
  await sequelize.sync();
  await ensureMessagesColumns();
  await ensureUsersColumns();
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();