const {User} = require("../models/User")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const Login = async (req, res) => {
    const { username, password } = req.body

    if(password) req.body.password 

    if(! username || !password) {
        return res.status(400).json({ message: 'username de usuario o password faltante' })
    }

    const user = await User.findOne({ where: {  username } })

    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' })
    const compare = await bcrypt.compare(password, user.password);

    if (!compare) return res.status(400).json({ message: 'Usuario o password incorrecta' })

    const token = jwt.sign({ userId: user.userId }, SECRET, { expiresIn: '8h' });

    res.json({ token })
    return res.status(200).json({ message: 'Login correcto, bienvenido a lost in music' })
}



const Register = async (req, res) => {
    const { email, username, password } = req.body

    if(password) req.body.password = "[REDACTED]"

    if(! username || !password || !email) {
        return res.status(400).json({ message: 'username de usuario o password o email faltante' })
    }


    const Hashedpassword = await bcrypt.hash(password, 10)
    try{
        const usuario = await Usuario.create({
            email,
            username,
            gender,
            birthDate,
            password: Hashedpassword,
            role: "User",
            eliminated: 0,
            penaltyDate: "nada",
            description: "agregar descripcion",
            followerAmount: 0,
            followingAmount: 0,
            profilePhoto,
            banner: "vacio",
            friendId: 2,
            ubication: "Agregar ubicacion",
            DVH: "1234567890123456789012345678901234567890123456789012345678901234" // Por ahora no tenemos el cálculo para hacer los dígitos verificadores
        })
        return res.status(201).json(user)
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            // Extrae los mensajes de error específicos
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({
                message: 'Validación fallida',
                details: messages
            });
        } else if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(400).json({ message: "Ya existe el email o usuario"});
        }
        console.log(error);
        return res.status(500).json({ message: "Hubo un error al ingresar el usuario" })
    }
}


const DeleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const usuario = await Usuario.findByPk(id)

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      })
    }

    await usuario.update({
      eliminado: true
    })

    res.status(200).json({
      message: 'Usuario eliminado correctamente'
    })

  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar usuario',
      error: error.message
    })
  }
}

const UpdateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const usert = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    const {
      username,
      description,
      profilePhoto,
      banner,
      ubication
    } = req.body;

    const dataUpdate = {};

    if (username !== undefined) dataUpdate.username = username;
    if (description !== undefined) dataUpdate.description = description;
    if (profilePhoto !== undefined) dataUpdate.profilePhoto = profilePhoto;
    if (banner !== undefined) dataUpdate.banner = banner;
    if (ubication !== undefined) dataUpdate.ubication = ubication;

    await user.update(dataUpdate);

    return res.status(200).json({
      message: "Usuario actualizado correctamente",
      user
    });

  } catch (error) {

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "El username de usuario ya existe"
      });
    }

    return res.status(500).json({
      message: "Error al actualizar usuario",
      error: error.message
    });
  }
};

module.exports = {
Login,
Register,
DeleteUser,
UpdateUser
}
