const express = require('express')
const { Login, Register, DeleteUser,} = require('./controllers/users')
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



server.listen(PORT, async () => {
    await sequelize.sync({ force: true })
    console.log("El server esta corriendo en el puerto 3000");
})