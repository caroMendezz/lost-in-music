
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { User } = require("../models/User");
const transporter = require("../config/mailer");

const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const RESEND_WAIT_MS = 60 * 1000; // 1 minuto entre solicitudes
const MAX_ATTEMPTS = 5;

// userId -> datos del cambio pendiente
const pendingChanges = new Map();

// userId -> momento de la última solicitud
const lastRequests = new Map();

const normalizeEmail = (value) =>
  String(value || "").trim().toLowerCase();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const RequestEmailChange = async (req, res) => {
  try {
    const user = req.user;
    const currentPassword = String(req.body.currentPassword || "");
    const newEmail = normalizeEmail(req.body.newEmail);
    const confirmEmail = normalizeEmail(req.body.confirmEmail);

    if (!currentPassword || !newEmail || !confirmEmail) {
      return res.status(400).json({
        message: "Completá la contraseña y los dos campos de correo.",
      });
    }

    if (newEmail !== confirmEmail) {
      return res.status(400).json({
        message: "Los correos electrónicos no coinciden.",
      });
    }

    if (!isValidEmail(newEmail)) {
      return res.status(400).json({
        message: "Ingresá una dirección de correo válida.",
      });
    }

    if (newEmail === normalizeEmail(user.email)) {
      return res.status(400).json({
        message: "El nuevo correo debe ser diferente al actual.",
      });
    }

    // Comprobar que quien solicita el cambio conoce la contraseña.
    const passwordIsValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        message: "La contraseña actual es incorrecta.",
      });
    }

    // No permitir utilizar el correo de otra cuenta.
    const existingUser = await User.findOne({
      where: {
        email: newEmail,
        userId: { [Op.ne]: user.userId },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Ese correo ya está registrado en otra cuenta.",
      });
    }

    const now = Date.now();
    const lastRequest = lastRequests.get(user.userId);

    if (lastRequest && now - lastRequest < RESEND_WAIT_MS) {
      return res.status(429).json({
        message: "Esperá un minuto antes de solicitar otro código.",
      });
    }

    // Código aleatorio de seis dígitos.
    const code = crypto.randomInt(100000, 1000000);

    // Guardar el hash, no el código original.
    pendingChanges.set(user.userId, {
      email: newEmail,
      codeHash: hashCode(String(code)),
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
    });

    lastRequests.set(user.userId, now);

    try {
      await transporter.sendMail({
        from: `"Lost In Music" <${transporter.MAIL_USER}>`,
        to: newEmail,
        subject: "Verificá tu nuevo correo · Lost In Music",
        text:
          `Tu código de verificación es: ${code}\n\n` +
          "Vence en 5 minutos. Si no solicitaste este cambio, ignorá este mensaje.",
      });
    } catch (mailError) {
      pendingChanges.delete(user.userId);
      lastRequests.delete(user.userId);
      throw mailError;
    }

    return res.json({
      message:
        "Te enviamos un código al nuevo correo. Revisá tu bandeja de entrada.",
      expiresInMinutes: 5,
    });
  } catch (error) {
    console.error("Error al solicitar cambio de correo:", error.message);

    return res.status(500).json({
      message: "No pudimos procesar la solicitud. Intentá nuevamente.",
    });
  }
};

const ConfirmEmailChange = async (req, res) => {
  try {
    const user = req.user;
    const code = String(req.body.code || "").trim();

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        message: "Ingresá un código válido de seis dígitos.",
      });
    }

    const pending = pendingChanges.get(user.userId);

    if (!pending) {
      return res.status(400).json({
        message: "No hay un cambio pendiente. Solicitá un código nuevo.",
      });
    }

    if (Date.now() >= pending.expiresAt) {
      pendingChanges.delete(user.userId);

      return res.status(400).json({
        message: "El código venció. Solicitá uno nuevo.",
      });
    }

    if (pending.attempts >= MAX_ATTEMPTS) {
      pendingChanges.delete(user.userId);

      return res.status(429).json({
        message: "Superaste los intentos permitidos. Solicitá otro código.",
      });
    }

    if (hashCode(code) !== pending.codeHash) {
      pending.attempts += 1;

      if (pending.attempts >= MAX_ATTEMPTS) {
        pendingChanges.delete(user.userId);

        return res.status(429).json({
          message: "Superaste los intentos permitidos. Solicitá otro código.",
        });
      }

      return res.status(400).json({
        message: "El código es incorrecto.",
        attemptsRemaining: MAX_ATTEMPTS - pending.attempts,
      });
    }

    // Volver a comprobar que el correo siga disponible.
    const existingUser = await User.findOne({
      where: {
        email: pending.email,
        userId: { [Op.ne]: user.userId },
      },
    });

    if (existingUser) {
      pendingChanges.delete(user.userId);

      return res.status(409).json({
        message: "Ese correo ya está registrado en otra cuenta.",
      });
    }

    // req.user proviene del token validado por checkToken.
    await user.update({ email: pending.email });

    pendingChanges.delete(user.userId);
    lastRequests.delete(user.userId);

    return res.json({
      message: "¡Correo electrónico actualizado correctamente!",
    });
  } catch (error) {
    // Una colisión de correo también puede ser detectada por el índice UNIQUE.
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Ese correo ya está registrado en otra cuenta.",
      });
    }

    console.error("Error al confirmar cambio de correo:", error.message);

    return res.status(500).json({
      message: "No pudimos actualizar el correo. Intentá nuevamente.",
    });
  }
};

module.exports = {
  RequestEmailChange,
  ConfirmEmailChange,
};
