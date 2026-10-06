const jwt = require('jsonwebtoken');
const { AuthService } = require('../services/authService');
// roles
const ROLES = {
    EMPLEADO: 'Empleado',
    JEFE: 'Jefe inmediato',
    ANALISTA: 'Analista de Nómina',
    GERENTE: 'Gerente',
    ASISTENTE: 'Asistente de planilla',
    ADMIN_TI: 'Administrador de TI'
};

class AuthMiddleware {
    // valida token
    static verificarToken(req, res, next) {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Debe iniciar sesión para acceder' });
        }

        const token = header.split(' ')[1];

        if (AuthService.estaRevocado(token)) {
            return res.status(401).json({ error: 'La sesión fue cerrada, inicie sesión de nuevo' });
        }

        try {
            req.usuario = jwt.verify(token, process.env.JWT_SECRET);
            req.token = token;
            next();
        } catch (err) {
            return res.status(401).json({ error: 'Sesión inválida o expirada' });
        }
    }

    // restringe el acceso segun rol
    static verificarRol(...rolesPermitidos) {
        return (req, res, next) => {
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
            }
            next();
        };
    }
}

module.exports = { AuthMiddleware, ROLES };