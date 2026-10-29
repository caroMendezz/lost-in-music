const { User } = require("../models/User");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


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

const Register = async (req, res) => {
  const { email, username, password, gender, profilePhoto, birthDate } =
    req.body;

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
      profilePhoto,
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
    const { id } = req.params;

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


const GetMyProfile = async (req, res) => {
  try {
    // El middleware de autenticación debe verificar el JWT
    // y guardar su payload en req.user.
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "No se pudo identificar al usuario autenticado",
      });
    }

    const user = await User.findOne({
      where: {
        userId,
        eliminated: 0,
      },
      attributes: [
        "userId",
        "username",
        "description",
        "birthDate",
        "gender",
        "followerAmount",
        "followingAmount",
        "profilePhoto",
        "banner",
        "ubication",
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error al obtener el perfil:", error);

    return res.status(500).json({
      message: "Error al obtener el perfil del usuario",
    });
  }
};


const UpdateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "No se pudo identificar al usuario autenticado",
      });
    }

    const user = await User.findOne({
      where: {
        userId,
        eliminated: 0,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const { username, description, ubication, profilePhoto, banner, } = req.body;
    const dataUpdate = {};

    if (username !== undefined) {
      if (typeof username !== "string" || !username.trim()) {
        return res.status(400).json({
          message: "El username no puede estar vacío",
        });
      }

      const cleanUsername = username.trim();

      if (cleanUsername.length > 100) {
        return res.status(400).json({
          message: "El username no puede superar los 100 caracteres",
        });
      }

      // Verificar que otro usuario no tenga el mismo username.
      const existingUser = await User.findOne({
        where: {
          username: cleanUsername,
          userId: { [Op.ne]: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Ese username ya está en uso",
        });
      }

      dataUpdate.username = cleanUsername;
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          message: "La descripción debe ser un texto",
        });
      }

      dataUpdate.description = description.trim();
    }

    if (ubication !== undefined) {
      if (typeof ubication !== "string") {
        return res.status(400).json({
          message: "La ubicación debe ser un texto",
        });
      }

      const cleanUbication = ubication.trim();

      if (cleanUbication.length > 150) {
        return res.status(400).json({
          message: "La ubicación no puede superar los 150 caracteres",
        });
      }

      dataUpdate.ubication = cleanUbication || "Agregar ubicacion";
    }

    if (profilePhoto !== undefined) {
      if (typeof profilePhoto !== "string" || !profilePhoto.trim()) {
        return res.status(400).json({
          message: "La foto de perfil no es válida",
        });
      }

      if (banner !== undefined) {
        if (typeof banner !== "string" || !banner.trim()) {
          return res.status(400).json({
            message: "El banner no es válido",
          });
        }

        const isBase64Image =
          /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i
            .test(banner);

        const isExistingUrl =
          /^(https?:\/\/|\/)/i.test(banner);

        if (!isBase64Image && !isExistingUrl) {
          return res.status(400).json({
            message: "El formato del banner no es válido",
          });
        }

        if (isBase64Image && banner.length > 7_000_000) {
          return res.status(413).json({
            message: "El banner es demasiado grande. Elegí una imagen de hasta 5 MB.",
          });
        }

        dataUpdate.banner = banner;
      }
      // Aceptar una imagen Base64 o una ruta/URL existente.
      const isBase64Image =
        /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i
          .test(profilePhoto);

      const isExistingUrl =
        /^(https?:\/\/|\/)/i.test(profilePhoto);

      if (!isBase64Image && !isExistingUrl) {
        return res.status(400).json({
          message: "El formato de la foto no es válido",
        });
      }

      // Límite de 5 MB aproximados para la imagen original.
      if (isBase64Image && profilePhoto.length > 7_000_000) {
        return res.status(413).json({
          message: "La foto es demasiado grande. Elegí una imagen de hasta 5 MB.",
        });
      }

      dataUpdate.profilePhoto = profilePhoto;
    }

    if (Object.keys(dataUpdate).length === 0) {
      return res.status(400).json({
        message: "No se recibieron cambios para guardar",
      });
    }

    await user.update(dataUpdate);

    return res.status(200).json({
      message: "Perfil actualizado correctamente",
      user: {
        userId: user.userId,
        username: user.username,
        description: user.description,
        ubication: user.ubication,
        profilePhoto: user.profilePhoto,
        banner: user.banner,
        followerAmount: user.followerAmount,
        followingAmount: user.followingAmount,
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Ese username ya está en uso",
      });
    }

    console.error("Error al actualizar el perfil:", error);

    return res.status(500).json({
      message: "Error al actualizar el perfil",
    });
  }
};




const GetUserProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "El ID del usuario no es válido",
      });
    }

    const user = await User.findOne({
      where: {
        userId,
        eliminated: 0,
      },
      attributes: [
        "userId",
        "username",
        "description",
        "followerAmount",
        "followingAmount",
        "profilePhoto",
        "banner",
        "ubication",
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error al obtener el perfil público:", error);

    return res.status(500).json({
      message: "Error al obtener el perfil del usuario",
    });
  }
};


module.exports = {
  Login,
  Register,
  DeleteUser,
  UpdateUser,
  GetMyProfile,
  UpdateMyProfile,
  GetUserProfile,
};
