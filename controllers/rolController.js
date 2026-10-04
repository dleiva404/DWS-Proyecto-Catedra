const Rol = require('../models/rolModel');

// Listar todos los roles
const listarRoles = (req, res) => {
    Rol.obtenerTodos((err, resultados) => {
        if (err) {
            console.error('Error al obtener roles:', err);
            return res.status(500).json({
                error: 'Error interno del servidor al consultar roles'
            });
        }

        res.json(resultados);
    });
};

// Obtener rol por ID
const obtenerRolPorId = (req, res) => {
    const { id } = req.params;

    Rol.obtenerPorId(id, (err, resultados) => {
        if (err) {
            console.error('Error al obtener rol:', err);
            return res.status(500).json({
                error: 'Error interno del servidor al consultar el rol'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                error: 'Rol no encontrado'
            });
        }

        res.json(resultados[0]);
    });
};

module.exports = {
    listarRoles,
    obtenerRolPorId
};