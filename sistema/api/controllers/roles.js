const Role = require("../models/Role")

const createRole = async (req, res) => {
  const {role} = req.body

  if (!role) {
    return res.status(400).json({ message: 'falta el rol' })
  }

  try {
    const roles = await Role.create({
      role,
    })
    return res.status(201).json(roles)
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      // Extrae los mensajes de error específicos
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({
        message: 'Validación fallida',
        details: messages
      });
    } else if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Ya existe el rol" });
    }
    console.log(error);
    return res.status(500).json({ message: "Hubo un error al ingresar el rol" })
  }
};

module.exports = {
    createRole
}