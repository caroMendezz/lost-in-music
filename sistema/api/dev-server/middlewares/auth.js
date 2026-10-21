const jwt = require('jsonwebtoken');
const {User} = require('../models/User');

const SECRET = 'SOCRATESLEPEGOUNPUNHETAZOENLACARA';

const checkToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();

        const decoded = jwt.verify(token, SECRET);
        console.log(decoded)

        const user = await User.findByPk(decoded.userId);
        console.log(user)

        if (!user) {
            return res.status(404).json({
                
                message: 'Usuario no encontrado',
                
            });
        }

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