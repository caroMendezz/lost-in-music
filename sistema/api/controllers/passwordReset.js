const crypto = require("crypto");
const transporter = require("../config/mailer");

/* ------------------------------------------------------------------
 * ⚙️ Ajustá estas dos líneas a tu proyecto si hace falta:
 *   - La ruta/nombre del modelo de usuarios.
 *   - El campo donde guardás el teléfono.
 * ------------------------------------------------------------------ */
//const PHONE_FIELD = "phone"; // ej: "phone" | "telefono" | "celular"

// El modelo se busca recién cuando se usa: si el nombre/ruta no coincide, el
// servidor arranca igual y solo esta ruta devuelve un error explicativo.
const path = require("path");

const MODEL_DIR = path.resolve(__dirname, "..", "models");
const MODEL_ERROR_PREFIX = "No encontré ningún modelo de usuarios";

const USER_MODEL_CANDIDATES = [
  "User",
  "user",
  "Users",
  "users",
  "Usuario",
  "usuario",
].map((name) => path.join(MODEL_DIR, name));

let cachedUserModel = null;

// Un módulo puede exportar el modelo directo, o envolverlo: { User }, { Users },
// { default: User }... Nos quedamos con lo que realmente tenga findOne().
const pickModel = (exported) => {
  if (!exported) return null;

  if (typeof exported.findOne === "function") return exported;

  if (exported.default && typeof exported.default.findOne === "function") {
    return exported.default;
  }

  if (typeof exported === "object") {
    for (const value of Object.values(exported)) {
      if (value && typeof value.findOne === "function") return value;
    }
  }

  return null;
};

const describeExport = (exported) => {
  if (exported === null) return "null";
  if (typeof exported !== "object") return typeof exported;

  const keys = Object.keys(exported);
  if (!keys.length) return "objeto vacío";

  return keys.map((key) => `${key} (${typeof exported[key]})`).join(", ");
};

const getUserModel = () => {
  if (cachedUserModel) return cachedUserModel;

  const fromEnv = process.env.USER_MODEL
    ? [path.resolve(__dirname, "..", process.env.USER_MODEL)]
    : [];
  const candidates = [...fromEnv, ...USER_MODEL_CANDIDATES];
  const report = [];

  for (const candidate of candidates) {
    let exported;

    try {
      exported = require(candidate);
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
      report.push(`  ${candidate} → no existe`);
      continue;
    }

    const model = pickModel(exported);

    if (model) {
      cachedUserModel = model;
      return model;
    }

    report.push(
      `  ${candidate} → existe pero no exporta un modelo (exporta: ${describeExport(
        exported
      )})`
    );
  }

  throw new Error(
    `${MODEL_ERROR_PREFIX} con findOne(). Busqué:\n${report.join("\n")}\n` +
      "Indicá el archivo correcto en el .env, por ejemplo: USER_MODEL=./models/User.js (relativo a la raíz del backend)."
  );
};

const isModelError = (error) =>
  String(error && error.message).startsWith(MODEL_ERROR_PREFIX);

// Resumen corto del error para mostrarlo en desarrollo (en producción no se envía)
const describeError = (error) => {
  const detail = [error && error.name, error && error.message]
    .filter(Boolean)
    .join(": ");
  return detail.length > 300 ? `${detail.slice(0, 300)}...` : detail;
};

// bcrypt o bcryptjs, el que uses en tu Register
let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = require("bcryptjs");
}

const CODE_TTL_MS = 10 * 60 * 1000; // el código vale 10 minutos
const MAX_ATTEMPTS = 5; // intentos por código antes de invalidarlo

// contact (email o teléfono ya normalizado) -> { code, expiresAt, attempts }
const resets = new Map();

const normalize = (value) => String(value || "").trim().toLowerCase();

// Acepta distintos nombres de campo por si el front manda "contact", "email", "correo"...
const pickContact = (body = {}) =>
  normalize(
    body.contact ??
      body.contacto ??
      body.correo ??
      body.email ??
      body.phone ??
      body.telefono ??
      body.celular ??
      ""
  );

// Deja en la consola del server exactamente qué llegó cuando devolvemos 400
const logBadRequest = (where, req) => {
  console.warn(
    `⚠️ ${where} 400 — content-type: ${
      req.headers["content-type"] || "(sin header)"
    } | body: ${JSON.stringify(req.body)}`
  );
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const maskEmail = (email) => {
  const [name, domain] = String(email).split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
};

// Busca la cuenta por email o por teléfono, según lo que escribió el usuario
const findUserByContact = async (contact) => {
  const User = getUserModel();

  if (isEmail(contact)) {
    return User.findOne({ where: { email: contact } });
  }
  //return User.findOne({ where: { [PHONE_FIELD]: contact } });
};

// Borra códigos vencidos para que el Map no crezca
const cleanup = () => {
  const now = Date.now();
  for (const [key, entry] of resets) {
    if (now > entry.expiresAt) resets.delete(key);
  }
};

/**
 * POST /password/forgot  { contact }
 * Envía un código de 6 dígitos al correo de la cuenta.
 * Si escribió un teléfono, se busca la cuenta por teléfono y se manda
 * el código al correo asociado a esa cuenta.
 */
const ForgotPassword = async (req, res) => {
  try {
    const contact = pickContact(req.body);

    if (!contact) {
      logBadRequest("ForgotPassword", req);
      return res
        .status(400)
        .json({ message: "Ingresá un correo o teléfono." });
    }

    // Respuesta genérica: no revelamos si la cuenta existe o no
    const generic = {
      message:
        "Si los datos coinciden con una cuenta, te enviamos un código al correo.",
    };

    const user = await findUserByContact(contact);
    if (!user) return res.json(generic);

    if (!user.email) {
      return res.status(400).json({
        message:
          "Tu cuenta no tiene un correo asociado. Contactá al soporte para recuperar la contraseña.",
      });
    }

    cleanup();

    const code = crypto.randomInt(100000, 1000000);

    resets.set(contact, {
      code,
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
    });

    await transporter.sendMail({
      from: `"Lost In Music" <${transporter.MAIL_USER || "no-reply@lostinmusic.app"}>`,
      to: user.email,
      subject: "Recuperá tu contraseña · Lost In Music",
      html: `
        <div style="background:#0f0f13;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:480px;margin:0 auto;background:#18181f;border-radius:16px;padding:32px;color:#f2f2f5;">
            <h2 style="margin:0 0 16px;font-size:20px;">Recuperar contraseña</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#b8b8c4;">
              Usá este código para elegir una nueva contraseña. Vence en 10 minutos.
            </p>
            <div style="background:#23232d;border-radius:12px;padding:20px;text-align:center;">
              <span style="font-size:32px;letter-spacing:8px;font-weight:bold;">${code}</span>
            </div>
            <p style="margin:24px 0 0;font-size:12px;color:#8a8a99;">
              Si no pediste este cambio, ignorá este correo: tu contraseña sigue igual.
            </p>
          </div>
        </div>
      `,
    });

    console.log(`✅ Código de recuperación enviado a ${maskEmail(user.email)}`);

    return res.json({
      ...generic,
      sentTo: maskEmail(user.email),
      expiresInMinutes: CODE_TTL_MS / 60000,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== "production";
    const detail = describeError(error);
    console.error("Error en ForgotPassword:", detail);
    return res.status(500).json({
      message:
        isDev && isModelError(error)
          ? error.message
          : "No pudimos enviar el correo. Probá de nuevo.",
      ...(isDev ? { detail } : {}),
    });
  }
};

/**
 * POST /password/reset  { contact, code, password }
 * Verifica el código y guarda la nueva contraseña (hasheada).
 */
const ResetPassword = async (req, res) => {
  try {
    const contact = pickContact(req.body);
    const code = String(req.body.code ?? "").trim();
    const password = String(req.body.password ?? "");

    if (!contact || !code || !password) {
      logBadRequest("ResetPassword", req);
      return res
        .status(400)
        .json({ message: "Faltan datos: correo/teléfono, código y contraseña." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres." });
    }

    const entry = resets.get(contact);
    if (!entry) {
      return res.status(400).json({
        message: "No hay un código pendiente para estos datos. Pedí uno nuevo.",
      });
    }

    if (Date.now() > entry.expiresAt) {
      resets.delete(contact);
      return res
        .status(400)
        .json({ message: "El código expiró. Pedí uno nuevo." });
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      resets.delete(contact);
      return res.status(400).json({
        message: "Demasiados intentos con este código. Pedí uno nuevo.",
      });
    }

    if (entry.code.toString() !== code) {
      entry.attempts += 1;
      return res.status(400).json({ message: "Código incorrecto." });
    }

    const user = await findUserByContact(contact);
    if (!user) {
      resets.delete(contact);
      return res
        .status(400)
        .json({ message: "No encontramos la cuenta. Pedí un código nuevo." });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    resets.delete(contact);

    return res.json({
      message: "Contraseña actualizada. Ya podés iniciar sesión.",
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== "production";
    const detail = describeError(error);
    console.error("Error en ResetPassword:", detail);
    return res.status(500).json({
      message:
        isDev && isModelError(error)
          ? error.message
          : "No pudimos cambiar la contraseña. Probá de nuevo.",
      ...(isDev ? { detail } : {}),
    });
  }
};

module.exports = { ForgotPassword, ResetPassword };
