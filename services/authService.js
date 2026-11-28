const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AuthModel = require('../models/authModel');
const { enviarCorreo } = require('./correoService');

// Error con código HTTP
class HttpError extends Error {
    constructor(mensaje, status) {
        super(mensaje);
        this.status = status;
    }
}

class AuthService {

    // Tokens logout
    static tokensRevocados = new Set();

    static logout(token) {
        AuthService.tokensRevocados.add(token);
    }

    static estaRevocado(token) {
        return AuthService.tokensRevocados.has(token);
    }

    // Valida que el jefe solo actúe sobre su personal
    static async esJefeDe(idJefe, idEmpleado) {
        if (!idJefe || !idEmpleado) return false;
        return AuthModel.esJefeDe(idJefe, idEmpleado);
    }

    // Verifica que la cuenta siga activa
    static async estaActivo(id_usuario) {
        return AuthModel.estaActivo(id_usuario);
    }

    // Inicio de sesión
    static async login(usuario, contrasena) {
        if (!usuario || !contrasena) {
            throw new HttpError('Usuario y/o contraseña no ingresados', 400);
        }

        const user = await AuthModel.buscarPorUsuario(usuario);

        if (!user) {
            throw new HttpError('Credenciales incorrectas', 401);
        }

        const valida = await bcrypt.compare(contrasena, user.contrasena_hash);

        if (!valida) {
            throw new HttpError('Credenciales incorrectas', 401);
        }

        if (!user.estado) {
            throw new HttpError('La cuenta está desactivada', 403);
        }

        const payload = {
            id_usuario: user.id_usuario,
            id_empleado: user.id_empleado,
            rol: user.rol
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '8h'
        });

        return {
            token,
            usuario: {
                usuario: user.usuario,
                nombre: user.nombre,
                apellido: user.apellido,
                rol: user.rol
            }
        };
    }

    // Solicitar recuperación de contraseña
    static async solicitarRecuperacion(correo, urlBase) {
        if (!correo) {
            throw new HttpError('Debe ingresar su correo electrónico', 400);
        }

        const user = await AuthModel.buscarPorCorreo(correo);

        // No revelar si el correo está registrado
        if (!user || !user.estado) {
            return;
        }

        // Generar token aleatorio
        const token = crypto.randomBytes(32).toString('hex');

        // Guardar únicamente el hash del token
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // El enlace tendrá una vigencia de 30 minutos
        const expira = new Date(Date.now() + 30 * 60 * 1000);

        // Invalidar enlaces de recuperación anteriores
        await AuthModel.invalidarRecuperacionesAnteriores(user.id_usuario);

        // Guardar la nueva solicitud
        await AuthModel.guardarRecuperacion(
            user.id_usuario,
            tokenHash,
            expira
        );

        const enlace = `${urlBase}/login/restablecer.html?token=${token}`;

        await enviarCorreo({
            destinatario: correo,
            asunto: 'Recuperación de contraseña - Sistema RRHH',
            html: `
                <h2>Recuperación de contraseña</h2>
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente enlace:</p>
                <a href="${enlace}">Restablecer mi contraseña</a>
                <p>Este enlace expirará en 30 minutos.</p>
                <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            `
        });
    }
    
    // Restablecer contraseña
    static async restablecerContrasena(token, contrasena) {
        if (!token || !contrasena) {
            throw new HttpError(
                'Debe ingresar el token y la nueva contraseña',
                400
            );
        }

        if (contrasena.length < 8) {
            throw new HttpError(
                'La contraseña debe tener al menos 8 caracteres',
                400
            );
        }

        // Calcular el hash del token recibido
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Encriptar la nueva contraseña
        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        // Validar el token y cambiar la contraseña en una transacción
        const actualizado = await AuthModel.cambiarContrasenaConToken(
            tokenHash,
            contrasenaHash
        );

        if (!actualizado) {
            throw new HttpError(
                'El enlace no es válido o ha expirado',
                400
            );
        }
    }
}

module.exports = { AuthService, HttpError };
