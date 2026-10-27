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
const {uploadFile} = require("./controllers/uploads");
const { Login, Register, DeleteUser, UpdateUser} = require('./controllers/users')
const {createPost, deletePost, updatePost, getPosts, getPostById, getReplies, toggleLike} = require('./controllers/posts')
const {createRole} = require('./controllers/roles')
const {SendVerificationCode, CheckVerificationCode} = require('./controllers/verify')
const {checkToken } = require('./middlewares/auth')
const {getMessages, getConversations, getUserById, markAsRead, searchUsers} = require('./controllers/messages')
const {createProduct, deleteProduct, updateProduct} = require('./controllers/products')
const setupChat = require("./sockets/chat");
const { setupPresence } = require("./sockets/presence");
const {
  getFriends, getFriendRequests, searchPeople,
  sendFriendRequest, acceptFriendRequest, removeFriendship
} = require("./controllers/friends");
const sequelize = require('./config/db')
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

// Cambio seguro de correo electrónico
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

server.post(
  '/password/change/request',
  checkToken,
  RequestPasswordChange
);

server.post(
  '/password/change/confirm',
  checkToken,
  ConfirmPasswordChange
);

server.patch('/deleteUser/:id',checkToken, DeleteUser);
server.patch('/updateUser/:id',checkToken, UpdateUser);

server.post('/CreatePost', checkToken, uploadPostMedia, createPost);
server.patch('/DeletePost/:id',checkToken, deletePost);
server.patch('/UpdatePost/:id',checkToken, uploadPostMedia, updatePost);
server.get('/GetPost', checkToken, getPosts);
server.get('/GetPost/:id', checkToken, getPostById);
server.get('/GetReplies/:id', checkToken, getReplies);
server.post('/LikePost/:id', checkToken, toggleLike); 

server.post('/CreateProduct', checkToken, createProduct);
server.patch('/DeleteProduct/:id',checkToken, deleteProduct);
server.patch('/UpdateProduct/:id',checkToken, updateProduct); 

server.post('/verify/send', SendVerificationCode);
server.post('/verify/check', CheckVerificationCode);

server.get("/messages/:otherUserId", checkToken, getMessages);

server.get("/conversations", checkToken, getConversations);
server.get("/users/search", checkToken, searchUsers);
server.get("/users/:id", checkToken, getUserById);
server.put("/messages/read/:otherUserId", checkToken, markAsRead);

server.get("/friends", checkToken, getFriends);
server.get("/friends/requests", checkToken, getFriendRequests);
server.get("/friends/search", checkToken, searchPeople);
server.post("/friends/request/:userId", checkToken, sendFriendRequest);
server.patch("/friends/accept/:userId", checkToken, acceptFriendRequest);
server.delete("/friends/:userId", checkToken, removeFriendship);

server.post("/Upload", checkToken, upload.single("file"), uploadFile);
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

setupChat(io);
setupPresence(io);

const start = async () => {
  await sequelize.sync();
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();