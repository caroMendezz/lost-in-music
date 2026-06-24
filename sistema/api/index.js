const express = require('express')
const { Login, Register, DeleteUser, UpdateUser} = require('./controllers/users')
const {createPost, deletePost, updatePost} = require('./controllers/posts')
const {SendVerificationCode, CheckVerificationCode} = require('./controllers/verify')
const { IsAuth, checkToken } = require('./middlewares/auth')
const sequelize = require('./config/db')
const connectDB = require("./config/dbnosql")
const server = express()

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

server.post('/login', Login)
server.post('/register', Register)
server.patch('/deleteUser/:id',checkToken, DeleteUser)
server.patch('/updateUser/:id',checkToken, UpdateUser)
server.post('/CreatePost', createPost)
server.patch('/DeletePost/:id',checkToken, deletePost)
server.patch('/UpdatePost/:id',checkToken, updatePost)
server.post('/verify/send', SendVerificationCode);
server.post('/verify/check', CheckVerificationCode);



server.listen(PORT, async () => {
    await sequelize.sync({ force: true })
    console.log("El server esta corriendo en el puerto 3000");
})
server.use(express.json())
connectDB()