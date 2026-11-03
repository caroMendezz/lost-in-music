const jwt = require('jsonwebtoken');
const {User} = require('../models/User');


const checkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    // 👇 VALIDACIÓN DE BANEO EN CADA PETICIÓN 👇
    if (user.penaltyDate && user.penaltyDate !== "nada") {
      const banDate = new Date(user.penaltyDate);
      
      if (!isNaN(banDate.getTime()) && banDate.getTime() > Date.now()) {
        const isPermanent = banDate.getFullYear() >= 9000;
        const formattedDate = isPermanent 
          ? "Permanente" 
          : banDate.toLocaleString('es-AR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        return res.status(403).json({ 
          message: `Tu cuenta está suspendida hasta: ${formattedDate}.`,
          code: 'USER_BANNED' // Código útil para el frontend
        });
      }
    }
    // 👆 FIN VALIDACIÓN DE BANEO 👆

    req.user = user;
    next();

  } catch (error) {
    console.error(error);
    return res.status(401).json({
      message: 'Token inválido o expirado'
    });
  }
};

const IsAuth = async (req, res, next) => {
    const permission = req.permission
    const idRole = req.user.idRole
    console.log(permission)

    const [rows] = await pool.query(`SELECT p.permission FROM Permission p 
        JOIN PermissionRole pr 
        ON pr.permissionId = p.permissionId
        WHERE pr.idRole = ?`, [idRole]); 

    permissionList = rows.map(p => p.permission)

    const hasPermission = permissionList.includes(permission)

    if (!hasPermission){
        return res.status(403).json({message : "No está autorizado"})
    }
    else(
        res.send(200).json({message: "permiso concedido"})
    )
    
    next()

} 

module.exports = {
    checkToken,
    IsAuth
};