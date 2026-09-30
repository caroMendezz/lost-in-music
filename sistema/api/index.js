const express = require('express')
const http = require("http");
const { Server } = require("socket.io");
const upload = require("./middlewares/upload");
const {uploadFile} = require("./controllers/uploads");
const { Login, Register, DeleteUser, UpdateUser} = require('./controllers/users')
const {createPost, deletePost, updatePost} = require('./controllers/posts')
const {SendVerificationCode, CheckVerificationCode} = require('./controllers/verify')
const { IsAuth, checkToken } = require('./middlewares/auth')
const {deleteMessage, createMessage} = require('./controllers/messages')
const {createProduct, deleteProduct, updateProduct} = require('./controllers/products')
const setupChat = require("./sockets/chat");
const sequelize = require('./config/db')
const connectDB = require("./config/dbnosql")
const server = express()

const httpServer = http.createServer(server);

const PORT = 3000

server.use(express.json())
server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
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
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
  }
});

server.post('/login', Login)
server.post('/register', Register)
server.patch('/deleteUser/:id',checkToken, DeleteUser)
server.patch('/updateUser/:id',checkToken, UpdateUser)
server.post('/CreatePost', createPost)
server.patch('/DeletePost/:id',checkToken, deletePost)
server.patch('/UpdatePost/:id',checkToken, updatePost)
server.post('/verify/send', SendVerificationCode);
server.post('/verify/check', CheckVerificationCode);
server.post('/DeletePost/:id', createProduct)
server.patch('/DeletePost/:id',checkToken, updateProduct)
server.patch('/DeletePost/:id',checkToken, deleteProduct)
server.post("/Upload",upload.single("file"),uploadFile);




server.use("/uploads", express.static("uploads"));


httpServer.listen(PORT, async () => {
  await sequelize.sync();

  console.log(`Server running on port ${PORT}`);
});

server.use(express.json())
connectDB()
setupChat(io);