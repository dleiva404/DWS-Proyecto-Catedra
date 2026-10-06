const { AuthService } = require('../services/authService');

class AuthController {
    //login
    static async login(req, res) {
        try {
            const { usuario, contrasena } = req.body;
            const resultado = await AuthService.login(usuario, contrasena);

            res.json({
                mensaje: 'Inicio de sesión exitoso',
                ...resultado
            });
        } catch (err) {
            // errores
            if (err.status) {
                return res.status(err.status).json({ error: err.message });
            }

            console.error('Error en login:', err);
            res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
        }
    }

    //logout
    static logout(req, res) {
        AuthService.logout(req.token);
        res.json({ mensaje: 'Sesión cerrada exitosamente' });
    }

    // perfil
    static perfil(req, res) {
        res.json(req.usuario);
    }
}

module.exports = AuthController;