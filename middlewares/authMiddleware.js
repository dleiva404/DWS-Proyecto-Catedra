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
    static async verificarToken(req, res, next) {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Debe iniciar sesión para acceder' });
        }

        const token = header.split(' ')[1];

        if (AuthService.estaRevocado(token)) {
            return res.status(401).json({ error: 'La sesión fue cerrada, inicie sesión de nuevo' });
        }

        let datos;
        try {
            datos = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Sesión inválida o expirada' });
        }

        try {
            const activo = await AuthService.estaActivo(datos.id_usuario);
            if (!activo) {
                return res.status(401).json({ error: 'La cuenta está desactivada' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Error al validar la sesión' });
        }

        req.usuario = datos;
        req.token = token;
        next();
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