
const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');

// Listar usuarios
const listarUsuarios = (req, res) => {
    Usuario.obtenerTodos((err, resultados) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({
                error: 'Error interno al consultar usuarios'
            });
        }

        res.json(resultados);
    });
};

// Obtener usuario por ID
const obtenerUsuarioPorId = (req, res) => {
    Usuario.obtenerPorId(req.params.id, (err, resultados) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({
                error: 'Error interno al consultar el usuario'
            });
        }

        if (!resultados.length) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json(resultados[0]);
    });
};

// Crear usuario
const crearUsuario = (req, res) => {
    const { id_rol, contrasena, estado } = req.body;
    const usuario = String(req.body.usuario || '').trim();

    if (!id_rol || !usuario || !contrasena) {
        return res.status(400).json({
            error: 'Usuario, contraseña y rol son obligatorios'
        });
    }

    if (String(contrasena).length < 8) {
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 8 caracteres'
        });
    }

    const nuevoUsuario = {
        id_rol,
        usuario,
        contrasena_hash: bcrypt.hashSync(contrasena, 10),
        estado: estado === undefined ? true : estado
    };

    Usuario.crear(nuevoUsuario, (err, resultado) => {
        if (err) {
            console.error('Error al crear usuario:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    error: 'El nombre de usuario ya está registrado'
                });
            }

            return res.status(500).json({
                error: 'Error al registrar el usuario'
            });
        }

        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            id: resultado.insertId
        });
    });
};

// Actualizar usuario
const actualizarUsuario = (req, res) => {
    const { id } = req.params;
    const { id_rol, contrasena, estado } = req.body;
    const usuario = String(req.body.usuario || '').trim();

    if (!id_rol || !usuario) {
        return res.status(400).json({
            error: 'El usuario y el rol son obligatorios'
        });
    }

    if (contrasena && String(contrasena).length < 8) {
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 8 caracteres'
        });
    }

    // Consultar primero para comprobar existencia y conservar el estado.
    Usuario.obtenerPorId(id, (err, resultados) => {
        if (err) {
            console.error('Error al consultar usuario:', err);
            return res.status(500).json({
                error: 'Error al consultar el usuario'
            });
        }

        if (!resultados.length) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        const actual = resultados[0];

        const usuarioActualizado = {
            id_rol,
            usuario,
            contrasena_hash: contrasena
                ? bcrypt.hashSync(contrasena, 10)
                : null,
            estado: estado === undefined ? actual.estado : estado
        };

        Usuario.actualizar(id, usuarioActualizado, (error, resultado) => {
            if (error) {
                console.error('Error al actualizar usuario:', error);

                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        error: 'El nombre de usuario ya está registrado'
                    });
                }

                return res.status(500).json({
                    error: 'Error al actualizar el usuario'
                });
            }

            // No se usa affectedRows para decidir si existe:
            // MySQL puede devolver cero si los datos no cambiaron.
            res.json({
                mensaje: 'Usuario actualizado exitosamente'
            });
        });
    });
};

// Desactivar usuario sin borrar el registro
const eliminarUsuario = (req, res) => {
    const { id } = req.params;

    Usuario.obtenerPorId(id, (err, resultados) => {
        if (err) {
            console.error('Error al consultar usuario:', err);
            return res.status(500).json({
                error: 'Error al consultar el usuario'
            });
        }

        if (!resultados.length) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        if (Number(resultados[0].estado) === 0) {
            return res.json({
                mensaje: 'El usuario ya estaba desactivado'
            });
        }

        Usuario.eliminar(id, (error) => {
            if (error) {
                console.error('Error al desactivar usuario:', error);
                return res.status(500).json({
                    error: 'Error al desactivar el usuario'
                });
            }

            res.json({
                mensaje: 'Usuario desactivado exitosamente'
            });
        });
    });
};

module.exports = {
    listarUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};
