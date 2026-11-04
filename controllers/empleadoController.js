const Empleado = require('../models/empleadoModel');
const SaldoVacaciones = require('../models/saldoVacacionesModel');

function validarDatosEmpleado(datos, idEmpleado) {
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(datos.correo))
        return 'El correo no tiene un formato válido';

    if (isNaN(new Date(datos.fecha_ingreso)))
        return 'La fecha de ingreso no es válida';

    if (idEmpleado && datos.id_supervisor && Number(datos.id_supervisor) === Number(idEmpleado))
        return 'Un empleado no puede ser su propio supervisor';

    return null;
}

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

// Obtener saldo de vacaciones del empleado para el año solicitado
const obtenerSaldoVacaciones = (req, res) => {
    const idEmpleado = Number(req.params.id);
    const anio = req.query.anio === undefined
        ? new Date().getFullYear()
        : Number(req.query.anio);

    if (!Number.isSafeInteger(idEmpleado) || idEmpleado <= 0 ||
        !Number.isInteger(anio) || anio < 2000 || anio > 2100) {
        return res.status(400).json({ error: 'Empleado o año no válido' });
    }

    Empleado.obtenerPorId(idEmpleado, (errorEmpleado, empleados) => {
        if (errorEmpleado) {
            console.error('Error al consultar empleado:', errorEmpleado);
            return res.status(500).json({ error: 'No fue posible consultar el empleado' });
        }

        if (!empleados.length) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        SaldoVacaciones.obtenerDiasDisponibles(idEmpleado, anio, (errorSaldo, saldos) => {
            if (errorSaldo) {
                console.error('Error al consultar saldo de vacaciones:', errorSaldo);
                return res.status(500).json({ error: 'No fue posible consultar el saldo de vacaciones' });
            }

            if (!saldos.length) {
                return res.json({ anio, registrado: false });
            }

            const saldo = saldos[0];
            res.json({
                anio,
                registrado: true,
                dias_asignados: Number(saldo.dias_asignados),
                dias_utilizados: Number(saldo.dias_utilizados),
                dias_disponibles: Number(saldo.dias_disponibles)
            });
        });
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
        fecha_ingreso
    } = req.body;

    if (!id_usuario || !nombre || !apellido || !correo || !cargo || !fecha_ingreso) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios'
        });
    }

    const errorDatos = validarDatosEmpleado(req.body);
    if (errorDatos) return res.status(400).json({ error: errorDatos });

    const nuevoEmpleado = {
        id_usuario,
        id_supervisor: id_supervisor || null,
        nombre,
        apellido,
        correo,
        cargo,
        fecha_ingreso,
        estado: true
    };

    Empleado.crear(nuevoEmpleado, (err, resultado) => {
        if (err) {
            console.error('Error al crear empleado:', err);

            // el usuario o el supervisor indicado no existe
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    error: 'El usuario o el supervisor indicado no existe'
                });
            }

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
        fecha_ingreso
    } = req.body;

    if (!id_usuario || !nombre || !apellido || !correo || !cargo || !fecha_ingreso) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios'
        });
    }

    const errorDatos = validarDatosEmpleado(req.body, id);
    if (errorDatos) return res.status(400).json({ error: errorDatos });

    const empleadoActualizado = {
        id_usuario,
        id_supervisor: id_supervisor || null,
        nombre,
        apellido,
        correo,
        cargo,
        fecha_ingreso
    };

    Empleado.actualizar(id, empleadoActualizado, (err, resultado) => {
        if (err) {
            console.error('Error al actualizar empleado:', err);

            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    error: 'El usuario o el supervisor indicado no existe'
                });
            }

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

// Reactivar empleado
const reactivarEmpleado = (req, res) => {
    const idEmpleado = Number(req.params.id);

    if (!Number.isSafeInteger(idEmpleado) || idEmpleado <= 0) {
        return res.status(400).json({ error: 'El identificador del empleado no es válido' });
    }

    Empleado.reactivar(idEmpleado, (err, resultado) => {
        if (err) {
            console.error('Error al reactivar empleado:', err);
            return res.status(500).json({ error: 'No fue posible reactivar el empleado' });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'El empleado no existe o ya está activo' });
        }

        res.json({ mensaje: 'Empleado reactivado exitosamente' });
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
        mensaje: 'Empleado desactivado exitosamente'
        });
    });
};

module.exports = {
    listarEmpleados,
    obtenerEmpleadoPorId,
    obtenerSaldoVacaciones,
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado,
    reactivarEmpleado
};