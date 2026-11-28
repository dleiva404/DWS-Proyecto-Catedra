const { AuthService } = require('../services/authService');

class AuthController {

    // Inicio de sesión
    static async login(req, res) {
        try {
            const { usuario, contrasena } = req.body;
            const resultado = await AuthService.login(usuario, contrasena);

            res.json({
                mensaje: 'Inicio de sesión exitoso',
                ...resultado
            });
        } catch (err) {
            if (err.status) {
                return res.status(err.status).json({ error: err.message });
            }

            console.error('Error en login:', err);
            res.status(500).json({
                error: 'Error interno del servidor al iniciar sesión'
            });
        }
    }

    // Cerrar sesión
    static logout(req, res) {
        AuthService.logout(req.token);
        res.json({ mensaje: 'Sesión cerrada exitosamente' });
    }

    // Consultar perfil
    static perfil(req, res) {
        res.json(req.usuario);
    }

    // Solicitar recuperación de contraseña
    static async olvideContrasena(req, res) {
        try {
            const { correo } = req.body;

            const urlBase = process.env.URL_PUBLICA ||
                `${req.protocol}://${req.get('host')}`;

            await AuthService.solicitarRecuperacion(correo, urlBase);

            res.json({
                mensaje: 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.'
            });

        } catch (err) {
            if (err.status) {
                return res.status(err.status).json({ error: err.message });
            }

            console.error('Error al solicitar recuperación:', err);
            res.status(500).json({
                error: 'No se pudo procesar la solicitud de recuperación'
            });
        }
    }

    // Restablecer contraseña
    static async restablecerContrasena(req, res) {
        try {
            const { token, contrasena } = req.body;

            await AuthService.restablecerContrasena(token, contrasena);

            res.json({
                mensaje: 'Tu contraseña ha sido restablecida correctamente.'
            });

        } catch (err) {
            if (err.status) {
                return res.status(err.status).json({ error: err.message });
            }

            console.error('Error al restablecer contraseña:', err);
            res.status(500).json({
                error: 'No se pudo restablecer la contraseña'
            });
        }
    }
}

module.exports = AuthController;
