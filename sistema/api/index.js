const express = require('express')
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const upload = require("./middlewares/upload");
const {uploadFile} = require("./controllers/uploads");
const { Login, Register, DeleteUser, UpdateUser} = require('./controllers/users')
const {createPost, deletePost, updatePost} = require('./controllers/posts')
const {SendVerificationCode, CheckVerificationCode} = require('./controllers/verify')
const {checkToken } = require('./middlewares/auth')
const {getMessages, getConversations, getUserById, markAsRead} = require('./controllers/messages')
const {createProduct, deleteProduct, updateProduct} = require('./controllers/products')
const setupChat = require("./sockets/chat");
const sequelize = require('./config/db')
const connectDB = require("./config/dbnosql")
const server = express()

const httpServer = http.createServer(server);

const PORT = 3000
const CLIENT_URL = "http://localhost:5173";

server.use(express.json())

server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CLIENT_URL)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
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

server.post('/login', Login);
server.post('/register', Register);
server.patch('/deleteUser/:id',checkToken, DeleteUser);
server.patch('/updateUser/:id',checkToken, UpdateUser);

server.post('/CreatePost', checkToken, createProduct);
server.patch('/DeletePost/:id',checkToken, deletePost);
server.patch('/UpdatePost/:id',checkToken, updatePost); 

server.post('/verify/send', SendVerificationCode);
server.post('/verify/check', CheckVerificationCode);

server.get("/messages/:otherUserId", checkToken, getMessages);

server.get("/conversations", checkToken, getConversations);
server.get("/users/:id", checkToken, getUserById);
server.put("/messages/read/:otherUserId", checkToken, markAsRead);

server.post("/Upload", checkToken, upload.single("file"), uploadFile);
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

setupChat(io);

const start = async () => {
  await sequelize.sync();
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();