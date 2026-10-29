// Verifica que el usuario autenticado (ya pasado por checkToken) sea Admin.
// El idRole 2 corresponde a "Admin" (ver Role.js → afterSync: User=1, Admin=2).
const isAdmin = (req, res, next) => {
  const idRole = Number(req.user?.idRole);

  if (idRole !== 2) {
    return res.status(403).json({ message: "No está autorizado" });
  }

  next();
};

module.exports = { isAdmin };