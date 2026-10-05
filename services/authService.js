const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/authModel');

// error con codigo http
class HttpError extends Error {
    constructor(mensaje, status) {
        super(mensaje);
        this.status = status;
    }
}

class AuthService {
    static async login(usuario, contrasena) {
        if (!usuario || !contrasena) {
            throw new HttpError('Usuario y/o contraseña no ingresados', 400);
        }

        const user = await AuthModel.buscarPorUsuario(usuario);

        // Error si el usuario fue mal ingresado o no existe
        if (!user) {
            throw new HttpError('Credenciales incorrectas', 401);
        }
        // Error si la contraseña fue mal ingresada
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

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

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