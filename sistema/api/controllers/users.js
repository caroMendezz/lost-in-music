const {Usuario} = require("../models/User")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const Login = async (req, res) => {
    const { nombre, contraseña } = req.body

    if(contraseña) req.body.contraseña 

    if(! nombre || !contraseña) {
        return res.status(400).json({ message: 'Nombre de usuario o contraseña faltante' })
    }

    const usuario = await Usuario.findOne({ where: {  nombre } })

    if (!usuario) return res.status(400).json({ message: 'Usuario no encontrado' })
    const compare = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!compare) return res.status(400).json({ message: 'Usuario o contraseña incorrecta' })

    //const token = jwt.sign({ idusuario: usuario.idusuario }, SECRET, { expiresIn: '8h' });

    //res.json({ token })
    return res.status(400).json({ message: 'Login correcto, bienvenido a lost in music' })
}

const Register = async (req, res) => {
    const { email, nombre, contraseña } = req.body

    if(contraseña) req.body.contraseña = "[REDACTED]"

    if(! nombre || !contraseña || !email) {
        return res.status(400).json({ message: 'Nombre de usuario o contraseña o email faltante' })
    }


    const Hashedcontraseña = await bcrypt.hash(contraseña, 10)
    try{
        const usuario = await Usuario.create({
            email,
            nombre,
            contraseña: Hashedcontraseña,
            rol: 2,
            eliminado: 0,
            fecha_penalizacion: "nada",
            descripcion: "agregar descripcion",
            cant_seguidores: 0,
            cant_seguidos: 0,
            foto_perfil: "vacio",
            banner: "vacio",
            id_amigo: 2,
            ubicacion: "Argentina",
            DVH: "1234567890123456789012345678901234567890123456789012345678901234" // Por ahora no tenemos el cálculo para hacer los dígitos verificadores
        })
        return res.status(201).json(usuario)
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


module.exports = {
    Login,
    Register,
}