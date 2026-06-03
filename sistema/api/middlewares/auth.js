const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET = 'SOCRATESLEPEGOUNPUNHETAZOENLACARA';

const isAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();

        const decoded = jwt.verify(token, SECRET);

        const user = await User.findByPk(decoded.idUser);

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = {
    isAuth
};