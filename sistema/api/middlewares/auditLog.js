const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { User } = require("../models/User");

/**
 * Bitácora de interacciones con los endpoints.
 *
 * Registra TODAS las requests excepto GET (también se ignoran HEAD y OPTIONS, que no son
 * interacciones). Cada una queda como una línea de texto en logs/bitacora.txt:
 *
 *   fecha=2026-10-28 15:32:10.123 -03:00 | timestamp=1793212330123 | usuario=ana (id 5) |
 *   endpoint=POST /CreatePost | status=201 | duracion=143ms | ip=::1 | token=sha256:9f2c...
 *
 * Qué NUNCA se guarda: contraseñas, cuerpos de las requests ni query strings.
 *
 * Sobre el token: por defecto se guarda una HUELLA (sha256 abreviado). Identifica el token
 * (se ve qué requests usaron el mismo) pero no sirve para hacerse pasar por el usuario.
 * Para guardar el token completo, arrancá el backend con AUDIT_LOG_TOKEN=full.
 */

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "bitacora.txt");

const TOKEN_MODE = process.env.AUDIT_LOG_TOKEN === "full" ? "full" : "hash";
const IGNORED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

fs.mkdirSync(LOG_DIR, { recursive: true });

// Un único stream en modo "append": mantiene el orden y no bloquea las requests
const stream = fs.createWriteStream(LOG_FILE, { flags: "a", encoding: "utf8" });
stream.on("error", (error) => console.error("No se pudo escribir la bitácora:", error.message));

// Evita que un dato con saltos de línea o "|" falsifique otra línea o campo del archivo
const clean = (value, max = 200) =>
  String(value ?? "").replace(/[\r\n\t|]+/g, " ").slice(0, max);

const pad = (n, length = 2) => String(n).padStart(length, "0");

// Fecha legible en la hora local del servidor, con su diferencia horaria
function formatLocal(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)} ` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

// El JWT solo trae el id del usuario: el nombre se busca en SQL (con caché para no consultar siempre)
const userCache = new Map(); // userId -> { name, expires }
const CACHE_MS = 10 * 60 * 1000;

async function usernameOf(userId) {
  const cached = userCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.name;

  try {
    const user = await User.findByPk(userId, { attributes: ["username"], raw: true });
    const name = user ? user.username : null;
    userCache.set(userId, { name, expires: Date.now() + CACHE_MS });
    return name;
  } catch {
    return null;
  }
}

async function describeUser(req) {
  // req.user lo completa checkToken con un JWT válido: es la única fuente confiable
  const id = req.user?.userId ?? req.user?.id;
  if (id !== undefined && id !== null) {
    const name = await usernameOf(id);
    return `${clean(name ?? "desconocido")} (id ${clean(id, 20)})`;
  }

  // Sin sesión (login, registro o token inválido): se anota el nombre ingresado, nunca la contraseña
  const typed = req.body && typeof req.body.username === "string" ? req.body.username : null;
  return typed ? `${clean(typed)} (sin sesión)` : "anónimo";
}

function describeToken(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) return "sin-token";
  if (TOKEN_MODE === "full") return clean(token, 2000);
  return `sha256:${crypto.createHash("sha256").update(token).digest("hex").slice(0, 16)}`;
}

async function writeEntry(req, res, startedAt) {
  const now = new Date();
  const user = await describeUser(req);

  // Sin query string (puede traer datos sensibles); con el id del recurso, ej. /DeletePost/65f...
  const endpoint = clean(req.originalUrl.split("?")[0], 300);

  const line = [
    `fecha=${formatLocal(now)}`,
    `timestamp=${now.getTime()}`,
    `usuario=${user}`,
    `endpoint=${req.method} ${endpoint}`,
    `status=${res.statusCode}`,
    `duracion=${Date.now() - startedAt}ms`,
    `ip=${clean(req.ip, 60)}`,
    `token=${describeToken(req)}`,
  ].join(" | ");

  stream.write(`${line}\n`);
}

// Se usa con server.use(auditLog), después de express.json() y antes de las rutas
module.exports = function auditLog(req, res, next) {
  if (IGNORED_METHODS.has(req.method)) return next();

  const startedAt = Date.now();

  // Se escribe al terminar la respuesta: ahí ya se conoce el usuario (checkToken) y el status
  res.on("finish", () => {
    writeEntry(req, res, startedAt).catch((error) =>
      console.error("Error en la bitácora:", error.message)
    );
  });

  next();
};