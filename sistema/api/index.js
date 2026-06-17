const express = require('express')
const { Login, Register, DeleteUser,} = require('./controllers/users')
const {createPost, deletePost, updatePost} = require('./controllers/posts')
const {SendVerificationCode, CheckVerificationCode} = require('./controllers/verify')
const { isAuth } = require('./middlewares/auth')

const sequelize = require('./config/db')
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
server.patch('/delete', DeleteUser)
server.post('/CreatePost', createPost)
server.patch('/DeletePost', deletePost)
server.patch('/UpdatePost', updatePost)
server.post('/verify/send', SendVerificationCode);
server.post('/verify/check', CheckVerificationCode);



server.listen(PORT, async () => {
    await sequelize.sync({ force: true })
    console.log("El server esta corriendo en el puerto 3000");
})