
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const transporter = require("../config/mailer");

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const pendingDeletions = new Map();
const lastRequests = new Map();

const hashCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const RequestAccountDeletion = async (req, res) => {
  try {
    const user = req.user;
    const currentPassword = String(req.body.currentPassword || "");
    const confirmText = String(req.body.confirmText || "");

    if (!currentPassword || confirmText !== "ELIMINAR") {
      return res.status(400).json({
        message: 'Ingresá tu contraseña y escribí "ELIMINAR" para confirmar.',
      });
    }

    if (user.eliminated === true || Number(user.eliminated) === 1) {
      return res.status(400).json({
        message: "Esta cuenta ya está desactivada.",
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

    pendingDeletions.set(user.userId, {
      codeHash: hashCode(code),
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
    });

    lastRequests.set(user.userId, now);

    try {
      await transporter.sendMail({
        from: `"Lost In Music" <${transporter.MAIL_USER}>`,
        to: user.email,
        subject: "Confirmación de eliminación de cuenta · Lost In Music",
        text:
          `Tu código de verificación es: ${code}\n\n` +
          "Este código vence en 5 minutos. " +
          "Si no solicitaste la eliminación de tu cuenta, ignorá este mensaje.",
      });
    } catch (mailError) {
      pendingDeletions.delete(user.userId);
      lastRequests.delete(user.userId);
      throw mailError;
    }

    return res.json({
      message: "Te enviamos un código de verificación a tu correo registrado.",
      expiresInMinutes: 5,
    });
  } catch (error) {
    console.error("Error al solicitar eliminación de cuenta:", error.message);

    return res.status(500).json({
      message: "No pudimos procesar la solicitud. Intentá nuevamente.",
    });
  }
};

const ConfirmAccountDeletion = async (req, res) => {
  try {
    const user = req.user;
    const code = String(req.body.code || "").trim();

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        message: "Ingresá un código válido de seis dígitos.",
      });
    }

    const pending = pendingDeletions.get(user.userId);

    if (!pending) {
      return res.status(400).json({
        message: "No hay una eliminación pendiente. Iniciá el proceso nuevamente.",
      });
    }

    if (Date.now() >= pending.expiresAt) {
      pendingDeletions.delete(user.userId);

      return res.status(400).json({
        message: "El código venció. Iniciá el proceso nuevamente.",
      });
    }

    if (pending.attempts >= MAX_ATTEMPTS) {
      pendingDeletions.delete(user.userId);

      return res.status(429).json({
        message: "Superaste los intentos permitidos. Iniciá el proceso nuevamente.",
      });
    }

    if (hashCode(code) !== pending.codeHash) {
      pending.attempts += 1;

      if (pending.attempts >= MAX_ATTEMPTS) {
        pendingDeletions.delete(user.userId);

        return res.status(429).json({
          message: "Superaste los intentos permitidos. Iniciá el proceso nuevamente.",
        });
      }

      return res.status(400).json({
        message: "El código es incorrecto.",
        attemptsRemaining: MAX_ATTEMPTS - pending.attempts,
      });
    }

    // Borrado lógico: no se elimina el registro de MySQL.
    await user.update({ eliminated: true });

    pendingDeletions.delete(user.userId);
    lastRequests.delete(user.userId);

    return res.json({
      message: "Tu cuenta fue desactivada correctamente.",
    });
  } catch (error) {
    console.error("Error al confirmar eliminación de cuenta:", error.message);

    return res.status(500).json({
      message: "No pudimos desactivar la cuenta. Intentá nuevamente.",
    });
  }
};

module.exports = {
  RequestAccountDeletion,
  ConfirmAccountDeletion,
};
