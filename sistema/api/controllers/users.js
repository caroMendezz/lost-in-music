const { User, DEFAULT_PROFILE_PHOTO } = require("../models/User");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { buildBanPayload, clearExpiredBan } = require("../services/banService");


const Login = async (req, res) => {
  const { username, password } = req.body;

  console.log({
    username: req.body.username,
    hasPassword: Boolean(req.body.password),
  });

  if (!username || !password) {
    return res.status(400).json({ message: "username o password faltante" });
  }

  try {
    // acepta login por username O por email (tu input es "correo o usuario")
    const user = await User.findOne({
      where: { [Op.or]: [{ username }, { email: username }] },
    });

    if (!user)
      return res.status(400).json({ message: "Usuario no encontrado" });

    const compare = await bcrypt.compare(password, user.password);
    if (!compare)
      return res.status(400).json({ message: "Usuario o password incorrecta" });

    // Sanción vigente: no se entrega token aunque las credenciales sean correctas.
    const ban = buildBanPayload(user);
    if (ban) {
      return res.status(403).json(ban);
    }

    // Sanción vencida: se limpia y el usuario puede volver a ingresar normalmente.
    await clearExpiredBan(user);

    const token = jwt.sign(
      { userId: user.userId, idRole: user.idRole },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    // UNA sola respuesta, con el rol incluido
    return res.json({ token, idRole: user.idRole });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

// GET /session -> valida el token y confirma que la cuenta no está sancionada.
// checkToken ya rechazó con 403 { code: "BANNED" } si la sanción está vigente.
const GetSession = async (req, res) => {
  const user = req.user;

  return res.status(200).json({
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      idRole: user.idRole,
      profilePhoto: user.profilePhoto,
    },
    banned: false,
  });
};

const Register = async (req, res) => {
  const { email, username, password, gender, profilePhoto, birthDate} =
    req.body;

  // La foto es opcional: si no viene (null, undefined o vacía) se asigna la
  // imagen predeterminada en lugar de fallar la validación del modelo.
  const chosenPhoto =
    typeof profilePhoto === "string" ? profilePhoto.trim() : "";
  const assignedPhoto = chosenPhoto || DEFAULT_PROFILE_PHOTO;

  if (password) req.body.password = "[REDACTED]";

  

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ message: "username de usuario o password o email faltante" });
  }

  const Hashedpassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({
      email,
      username,
      gender,
      birthDate,
      password: Hashedpassword,
      idRole: 1,
      eliminated: 0,
      penaltyDate: "nada",
      description: "agregar descripcion",
      followerAmount: 0,
      followingAmount: 0,
      profilePhoto: assignedPhoto,
      banner: "vacio",
      friendId: 2,
      ubication: "Agregar ubicacion",
      DVH: "1234567890123456789012345678901234567890123456789012345678901234", // Por ahora no tenemos el cálculo para hacer los dígitos verificadores
    });
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
      return res.status(400).json({ message: "Ya existe el email o usuario" });
    }
    console.log(error);
    return res.status(500).json({ message: "Hubo un error al ingresar el usuario" })
  }
}


const DeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await User.findByPk(id)

    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }
    res.status(200).json({
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar usuario",
      error: error.message,
    });
  }
}

const UpdateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const { username, description, profilePhoto, banner, ubication } = req.body;

    const dataUpdate = {};

    if (username !== undefined) dataUpdate.username = username;
    if (description !== undefined) dataUpdate.description = description;
    if (profilePhoto !== undefined) dataUpdate.profilePhoto = profilePhoto;
    if (banner !== undefined) dataUpdate.banner = banner;
    if (ubication !== undefined) dataUpdate.ubication = ubication;

    await user.update(dataUpdate);

    return res.status(200).json({
      message: "Usuario actualizado correctamente",
      user,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "El username de usuario ya existe",
      });
    }

    return res.status(500).json({
      message: "Error al actualizar usuario",
      error: error.message,
    });
  }
};

module.exports = {
  Login,
  Register,
  DeleteUser,
  UpdateUser,
  GetSession,
};
