// Estado de las sanciones (baneos temporales) de los usuarios.
// La vigencia SIEMPRE se calcula con bannedUntil contra la fecha actual:
// una sanción vencida deja de bloquear aunque no se haya limpiado la fila.

const BAN_CODE = "BANNED";

// Devuelve la fecha de vencimiento si la sanción sigue vigente, o null.
const getBanExpiration = (user) => {
  if (!user || !user.bannedUntil) return null;

  const until = new Date(user.bannedUntil);
  if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) return null;

  return until;
};

const isUserBanned = (user) => Boolean(getBanExpiration(user));

// Limpia los datos de una sanción ya vencida (se llama al validar la cuenta).
const clearExpiredBan = async (user) => {
  if (!user || !user.bannedUntil || getBanExpiration(user)) return;

  await user.update({ bannedUntil: null, banReason: null });
};

// Respuesta uniforme para HTTP y sockets.
const buildBanPayload = (user) => {
  const until = getBanExpiration(user);
  if (!until) return null;

  return {
    code: BAN_CODE,
    message: `Tu cuenta está suspendida temporalmente hasta el ${until.toLocaleString("es-AR")}.`,
    bannedUntil: until.toISOString(),
    banReason: user.banReason || null,
  };
};

module.exports = {
  BAN_CODE,
  getBanExpiration,
  isUserBanned,
  clearExpiredBan,
  buildBanPayload,
};
