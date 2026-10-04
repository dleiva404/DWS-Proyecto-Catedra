const Usuario = require('../models/usuarioModel');

// Listar todos los usuarios
const listarUsuarios = (req, res) => {
    Usuario.obtenerTodos((err, resultados) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({
                error: 'Error interno del servidor al consultar usuarios'
            });
        }

        res.json(resultados);
    });
};

// Obtener usuario por ID
const obtenerUsuarioPorId = (req, res) => {
    const { id } = req.params;

    Usuario.obtenerPorId(id, (err, resultados) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({
                error: 'Error interno del servidor al consultar el usuario'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json(resultados[0]);
    });
};

// Crear usuario
// El hash de contraseña será integrado por el módulo de autenticación (Parte 3)
const crearUsuario = (req, res) => {
    const {
        id_rol,
        usuario,
        contrasena_hash,
        estado
    } = req.body;

    if (!id_rol || !usuario || !contrasena_hash) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios'
        });
    }

    const nuevoUsuario = {
        id_rol,
        usuario,
        contrasena_hash,
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
                error: 'Error al registrar el usuario en la base de datos'
            });
        }

        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            id: resultado.insertId
        });
    });
};

// Actualizar usuario
// El manejo seguro de contraseñas será integrado por la Parte 3
const actualizarUsuario = (req, res) => {
    const { id } = req.params;

    const {
        id_rol,
        usuario,
        contrasena_hash,
        estado
    } = req.body;

    if (!id_rol || !usuario || !contrasena_hash) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios'
        });
    }

    const usuarioActualizado = {
        id_rol,
        usuario,
        contrasena_hash,
        estado: estado === undefined ? true : estado
    };

    Usuario.actualizar(id, usuarioActualizado, (err, resultado) => {
        if (err) {
            console.error('Error al actualizar usuario:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    error: 'El nombre de usuario ya está registrado'
                });
            }

            return res.status(500).json({
                error: 'Error al actualizar el usuario'
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            mensaje: 'Usuario actualizado exitosamente'
        });
    });
};

// Eliminar usuario
const eliminarUsuario = (req, res) => {
    const { id } = req.params;

    Usuario.eliminar(id, (err, resultado) => {
        if (err) {
            console.error('Error al eliminar usuario:', err);

            return res.status(500).json({
                error: 'Error al eliminar el usuario'
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            mensaje: 'Usuario eliminado exitosamente'
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