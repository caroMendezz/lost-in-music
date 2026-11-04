const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const Role = require('../models/Role');
const { buildBanPayload, clearExpiredBan } = require('../services/banService');


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

        // Una sanción vigente bloquea CUALQUIER endpoint autenticado.
        const ban = buildBanPayload(user);
        if (ban) {
            return res.status(403).json(ban);
        }

        // Sanción vencida: se limpia para que la cuenta vuelva a estar habilitada.
        await clearExpiredBan(user);

        req.user = user;

        next();

    } catch (error) {
        console.error(error);
        return res.status(401).json({
            message: 'Token inválido o expirado'
        });
    }
};

// Debe usarse siempre después de checkToken.
const checkAdmin = async (req, res, next) => {
    try {
        const role = await Role.findByPk(req.user.idRole);

        if (!role || role.role !== 'Admin') {
            return res.status(403).json({
                message: 'No está autorizado para realizar esta acción'
            });
        }

        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al verificar los permisos'
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
    checkAdmin,
    IsAuth
};