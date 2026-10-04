const Empleado = require('../models/empleadoModel');

// Listar todos los empleados
const listarEmpleados = (req, res) => {
    Empleado.obtenerTodos((err, resultados) => {
        if (err) {
            console.error('Error al obtener empleados:', err);
            return res.status(500).json({
                error: 'Error interno del servidor al consultar empleados'
            });
        }

        res.json(resultados);
    });
};

// Obtener empleado por ID
const obtenerEmpleadoPorId = (req, res) => {
    const { id } = req.params;

    Empleado.obtenerPorId(id, (err, resultados) => {
        if (err) {
            console.error('Error al obtener empleado:', err);
            return res.status(500).json({
                error: 'Error interno del servidor al consultar el empleado'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                error: 'Empleado no encontrado'
            });
        }

        res.json(resultados[0]);
    });
};

// Crear empleado
const crearEmpleado = (req, res) => {
    const {
        id_usuario,
        id_supervisor,
        nombre,
        apellido,
        correo,
        cargo,
        fecha_ingreso,
        estado
    } = req.body;

    if (!id_usuario || !nombre || !apellido || !correo || !cargo || !fecha_ingreso) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios'
        });
    }

    const nuevoEmpleado = {
        id_usuario,
        id_supervisor: id_supervisor || null,
        nombre,
        apellido,
        correo,
        cargo,
        fecha_ingreso,
        estado: estado === undefined ? true : estado
    };

    Empleado.crear(nuevoEmpleado, (err, resultado) => {
        if (err) {
            console.error('Error al crear empleado:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    error: 'El usuario o correo ya está asociado a un empleado'
                });
            }

            return res.status(500).json({
                error: 'Error al registrar el empleado en la base de datos'
            });
        }

        res.status(201).json({
            mensaje: 'Empleado creado exitosamente',
            id: resultado.insertId
        });
    });
};

// Actualizar empleado
const actualizarEmpleado = (req, res) => {
    const { id } = req.params;

    const {
        id_usuario,
        id_supervisor,
        nombre,
        apellido,
        correo,
        cargo,
        fecha_ingreso,
        estado
    } = req.body;

    if (!id_usuario || !nombre || !apellido || !correo || !cargo || !fecha_ingreso) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios'
        });
    }

    const empleadoActualizado = {
        id_usuario,
        id_supervisor: id_supervisor || null,
        nombre,
        apellido,
        correo,
        cargo,
        fecha_ingreso,
        estado: estado === undefined ? true : estado
    };

    Empleado.actualizar(id, empleadoActualizado, (err, resultado) => {
        if (err) {
            console.error('Error al actualizar empleado:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    error: 'El usuario o correo ya está asociado a otro empleado'
                });
            }

            return res.status(500).json({
                error: 'Error al actualizar el empleado'
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                error: 'Empleado no encontrado'
            });
        }

        res.json({
            mensaje: 'Empleado actualizado exitosamente'
        });
    });
};

// Eliminar empleado
const eliminarEmpleado = (req, res) => {
    const { id } = req.params;

    Empleado.eliminar(id, (err, resultado) => {
        if (err) {
            console.error('Error al eliminar empleado:', err);

            return res.status(500).json({
                error: 'Error al eliminar el empleado'
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                error: 'Empleado no encontrado'
            });
        }

        res.json({
            mensaje: 'Empleado eliminado exitosamente'
        });
    });
};

module.exports = {
    listarEmpleados,
    obtenerEmpleadoPorId,
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado
};