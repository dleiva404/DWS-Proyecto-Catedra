const db = require('../config/db');

class AuthModel {
    // Verificar usuario y rol
    static async buscarPorUsuario(usuario) {
        const [rows] = await db.promise().query(
            `SELECT u.id_usuario, u.usuario, u.contrasena_hash, u.estado,
                    r.nombre AS rol, e.id_empleado, e.nombre, e.apellido
             FROM usuario u
             JOIN rol r ON r.id_rol = u.id_rol
             LEFT JOIN empleado e ON e.id_usuario = u.id_usuario
             WHERE u.usuario = ?`,
            [usuario]
        );
        return rows[0];
    }

    // Buscar usuario mediante su correo electrónico
    static async buscarPorCorreo(correo) {
        const [rows] = await db.promise().query(
            `SELECT u.id_usuario, u.usuario, u.estado, e.correo
             FROM usuario u
             JOIN empleado e ON e.id_usuario = u.id_usuario
             WHERE e.correo = ?`,
            [correo]
        );
        return rows[0];
    }

    // Guardar solicitud de recuperación
    static async guardarRecuperacion(idUsuario, tokenHash) {
        await db.promise().query(
            `INSERT INTO recuperacion_contrasena
         (id_usuario, token_hash, expira)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
            [idUsuario, tokenHash]
        );
    }

    // Invalidar solicitudes de recuperación anteriores
    static async invalidarRecuperacionesAnteriores(idUsuario) {
        await db.promise().query(
            `UPDATE recuperacion_contrasena
             SET usado = TRUE
             WHERE id_usuario = ?
             AND usado = FALSE`,
            [idUsuario]
        );
    }

    // Cambiar contraseña y consumir el token
    static async cambiarContrasenaConToken(tokenHash, contrasenaHash) {
        const conexion = await db.promise().getConnection();

        try {
            await conexion.beginTransaction();

            // Buscar y bloquear el token mientras se procesa
            const [rows] = await conexion.query(
                `SELECT id_recuperacion, id_usuario
             FROM recuperacion_contrasena
             WHERE token_hash = ?
             AND expira > NOW()
             AND usado = FALSE
             FOR UPDATE`,
                [tokenHash]
            );

            if (rows.length === 0) {
                await conexion.rollback();
                return false;
            }

            const recuperacion = rows[0];

            // Actualizar la contraseña
            await conexion.query(
                `UPDATE usuario
             SET contrasena_hash = ?
             WHERE id_usuario = ?`,
                [contrasenaHash, recuperacion.id_usuario]
            );

            // Marcar el token como utilizado
            await conexion.query(
                `UPDATE recuperacion_contrasena
             SET usado = TRUE
             WHERE id_recuperacion = ?`,
                [recuperacion.id_recuperacion]
            );

            await conexion.commit();
            return true;

        } catch (error) {
            await conexion.rollback();
            throw error;

        } finally {
            conexion.release();
        }
    }

    // Verificar si idEmpleado tiene como supervisor directo a idJefe
    static async esJefeDe(idJefe, idEmpleado) {
        const [rows] = await db.promise().query(
            'SELECT id_empleado FROM empleado WHERE id_empleado = ? AND id_supervisor = ?',
            [idEmpleado, idJefe]
        );
        return rows.length > 0;
    }

    // Verificar si la cuenta sigue activa
    static async estaActivo(id_usuario) {
        const [rows] = await db.promise().query(
            'SELECT estado FROM usuario WHERE id_usuario = ?',
            [id_usuario]
        );
        return rows.length > 0 && !!rows[0].estado;
    }
}

module.exports = AuthModel;
