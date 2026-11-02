
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/authModel');

// Error con código HTTP
class HttpError extends Error {
    constructor(mensaje, status) {
        super(mensaje);
        this.status = status;
    }
}

class AuthService {
    // Tokens revocados durante la ejecución del servidor
    static tokensRevocados = new Set();

    static logout(token) {
        if (token) {
            AuthService.tokensRevocados.add(token);
        }
    }

    static estaRevocado(token) {
        return AuthService.tokensRevocados.has(token);
    }

    // Validar que el jefe solo actúe sobre su personal
    static async esJefeDe(idJefe, idEmpleado) {
        if (!idJefe || !idEmpleado) {
            return false;
        }

        return AuthModel.esJefeDe(idJefe, idEmpleado);
    }

    // Comprobar que la cuenta siga activa
    static async estaActivo(id_usuario) {
        return AuthModel.estaActivo(id_usuario);
    }

    // Iniciar sesión
    static async login(usuario, contrasena) {
        if (!usuario || !contrasena) {
            throw new HttpError(
                'Usuario y/o contraseña no ingresados',
                400
            );
        }

        const user = await AuthModel.buscarPorUsuario(usuario);

        // Usuario inexistente
        if (!user) {
            throw new HttpError(
                'Credenciales incorrectas',
                401
            );
        }

        // Verificar contraseña usando el hash almacenado
        const valida = await bcrypt.compare(
            contrasena,
            user.contrasena_hash
        );

        if (!valida) {
            throw new HttpError(
                'Credenciales incorrectas',
                401
            );
        }

        // Rechazar cuentas inactivas
        if (Number(user.estado) !== 1) {
            throw new HttpError(
                'La cuenta está desactivada',
                403
            );
        }

        // Datos incluidos en el token
        const payload = {
            id_usuario: user.id_usuario,
            id_empleado: user.id_empleado,
            rol: user.rol
        };

        if (!process.env.JWT_SECRET) {
            throw new Error(
                'La variable JWT_SECRET no está configurada'
            );
        }

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

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
}

module.exports = { AuthService, HttpError };
