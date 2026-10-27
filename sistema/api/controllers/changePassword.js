
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const transporter = require("../config/mailer");

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// userId -> datos del cambio de contraseña pendiente
const pendingChanges = new Map();

// userId -> momento de la última solicitud
const lastRequests = new Map();

const hashCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const RequestPasswordChange = async (req, res) => {
  try {
    const user = req.user;
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Completá todos los campos.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Las nuevas contraseñas no coinciden.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 8 caracteres.",
      });
    }

    const passwordIsValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        message: "La contraseña actual es incorrecta.",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        message: "La nueva contraseña debe ser diferente de la actual.",
      });
    }

    if (!user.email) {
      return res.status(400).json({
        message: "Tu cuenta no tiene un correo registrado.",
      });
    }

    const now = Date.now();
    const lastRequest = lastRequests.get(user.userId);

    if (lastRequest && now - lastRequest < RESEND_WAIT_MS) {
      return res.status(429).json({
        message: "Esperá un minuto antes de solicitar otro código.",
      });
    }

    const code = String(crypto.randomInt(100000, 1000000));

    // Guardamos el hash de la nueva contraseña, no la contraseña original.
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    pendingChanges.set(user.userId, {
      newPasswordHash,
      codeHash: hashCode(code),
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
    });

    lastRequests.set(user.userId, now);

    try {
      await transporter.sendMail({
        from: `"Lost In Music" <${transporter.MAIL_USER}>`,
        to: user.email,
        subject: "Verificá el cambio de contraseña · Lost In Music",
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
      message: "Te enviamos un código de verificación a tu correo registrado.",
      expiresInMinutes: 5,
    });
  } catch (error) {
    console.error("Error al solicitar cambio de contraseña:", error.message);

    return res.status(500).json({
      message: "No pudimos procesar la solicitud. Intentá nuevamente.",
    });
  }
};

const ConfirmPasswordChange = async (req, res) => {
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

    // Guardar la contraseña solo después de verificar el código.
    await user.update({
      password: pending.newPasswordHash,
    });

    pendingChanges.delete(user.userId);
    lastRequests.delete(user.userId);

    return res.json({
      message: "¡Contraseña actualizada correctamente!",
    });
  } catch (error) {
    console.error("Error al confirmar cambio de contraseña:", error.message);

    return res.status(500).json({
      message: "No pudimos actualizar la contraseña. Intentá nuevamente.",
    });
  }
};

module.exports = {
  RequestPasswordChange,
  ConfirmPasswordChange,
};
