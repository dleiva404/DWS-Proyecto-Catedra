const Solicitud = require('../models/solicitudModel');
const SaldoVacaciones = require('../models/saldoVacacionesModel');
const EtapaSolicitud = require('../models/etapaSolicitudModel');

const SolicitudService = {

    obtenerMisSolicitudes: (id_empleado, callback) => {
        if (!id_empleado) return callback({ status: 400, mensaje: 'El empleado no está identificado' });

        Solicitud.obtenerPorEmpleado(id_empleado, (err, resultados) => {
            if (err) return callback({ status: 500, mensaje: 'Error interno al consultar las solicitudes' });
            callback(null, resultados);
        });
    },

    validarVacaciones: (id_empleado, fecha_inicio, fecha_fin, callback) => {
        if (!id_empleado) return callback({ status: 400, mensaje: 'El empleado no está identificado' });
        if (!fecha_inicio || !fecha_fin) return callback({ status: 400, mensaje: 'La fecha de inicio y fin son obligatorias' });

        const inicio = new Date(fecha_inicio);
        const fin = new Date(fecha_fin);

        if (isNaN(inicio) || isNaN(fin))
            return callback({ status: 400, mensaje: 'Las fechas no son válidas' });

        if (fin < inicio)
            return callback({ status: 400, mensaje: 'La fecha de fin no puede ser anterior a la fecha de inicio' });

        const diasSolicitados = Math.floor((fin - inicio) / 86400000) + 1;

        Solicitud.buscarTraslape(id_empleado, fecha_inicio, fecha_fin, (err, traslapes) => {
            if (err) return callback({ status: 500, mensaje: 'Error al verificar las fechas' });

            if (traslapes.length)
                return callback({ status: 400, mensaje: 'Ya existe una solicitud de vacaciones en ese rango' });

            const anio = inicio.getFullYear();

            SaldoVacaciones.obtenerDiasDisponibles(id_empleado, anio, (err, saldos) => {
                if (err) return callback({ status: 500, mensaje: 'Error al consultar el saldo de vacaciones' });
                if (!saldos.length) return callback({ status: 400, mensaje: 'No existe saldo de vacaciones para ese año' });

                const saldo = saldos[0];

                if (diasSolicitados > saldo.dias_disponibles)
                    return callback({
                        status: 400,
                        mensaje: `No tiene suficientes días. Disponibles: ${saldo.dias_disponibles}`
                    });

                callback(null, {
                    diasSolicitados,
                    diasDisponibles: saldo.dias_disponibles,
                    anio
                });
            });
        });
    },

    crearSolicitud: (data, callback) => {
        const { id_empleado, id_tipo_solicitud, fecha_inicio, fecha_fin, motivo } = data;

        if (!id_empleado)
            return callback({ status: 400, mensaje: 'El empleado no está identificado' });

        if (![1, 2].includes(Number(id_tipo_solicitud)))
            return callback({ status: 400, mensaje: 'Tipo de solicitud no válido' });

        if (Number(id_tipo_solicitud) === 1) {
            return SolicitudService.validarVacaciones(
                id_empleado, fecha_inicio, fecha_fin,
                (error, validacion) => {
                    if (error) return callback(error);

                    Solicitud.crear({
                        id_empleado,
                        id_tipo_solicitud: 1,
                        fecha_inicio,
                        fecha_fin,
                        motivo: motivo || null,
                        estado: 'Pendiente'
                    }, (err, resultado) => {
                        if (err) return callback({ status: 500, mensaje: 'Error al crear la solicitud' });

                        const id = resultado.insertId;

                        const etapas = [
                            { id_solicitud: id, id_rol: 3, nombre_etapa: 'Analista de Nómina', orden: 1, estado: 'Pendiente', fecha_inicio: new Date(), fecha_resolucion: null, decision: null, comentario: null },
                            { id_solicitud: id, id_rol: 4, nombre_etapa: 'Gerente', orden: 2, estado: 'Bloqueada', fecha_inicio: null, fecha_resolucion: null, decision: null, comentario: null },
                            { id_solicitud: id, id_rol: 2, nombre_etapa: 'Jefe inmediato', orden: 3, estado: 'Bloqueada', fecha_inicio: null, fecha_resolucion: null, decision: null, comentario: null }
                        ];

                        crearEtapas(etapas, 0, errorEtapas => {
                            if (errorEtapas) return callback(errorEtapas);

                            callback(null, {
                                mensaje: 'Solicitud de vacaciones creada correctamente',
                                id_solicitud: id,
                                diasSolicitados: validacion.diasSolicitados,
                                diasDisponibles: validacion.diasDisponibles
                            });
                        });
                    });
                }
            );
        }

        if (!motivo || !motivo.trim())
            return callback({ status: 400, mensaje: 'El motivo es obligatorio para un permiso' });

        Solicitud.crear({
            id_empleado,
            id_tipo_solicitud: 2,
            fecha_inicio: fecha_inicio || null,
            fecha_fin: fecha_fin || null,
            motivo: motivo.trim(),
            estado: 'Pendiente'
        }, (err, resultado) => {
            if (err) return callback({ status: 500, mensaje: 'Error al crear la solicitud de permiso' });

            const id = resultado.insertId;

            const etapas = [
                { id_solicitud: id, id_rol: 2, nombre_etapa: 'Jefe inmediato', orden: 1, estado: 'Pendiente', fecha_inicio: new Date(), fecha_resolucion: null, decision: null, comentario: null },
                { id_solicitud: id, id_rol: 3, nombre_etapa: 'Analista de Nómina', orden: 2, estado: 'Bloqueada', fecha_inicio: null, fecha_resolucion: null, decision: null, comentario: null }
            ];

            crearEtapas(etapas, 0, errorEtapas => {
                if (errorEtapas) return callback(errorEtapas);

                callback(null, {
                    mensaje: 'Solicitud de permiso creada correctamente',
                    id_solicitud: id
                });
            });
        });
    },

    resolverEtapa: (id_etapa, rol, decision, comentario, callback) => {
        if (!id_etapa) return callback({ status: 400, mensaje: 'La etapa es obligatoria' });

        if (!['Aprobada', 'Rechazada'].includes(decision))
            return callback({ status: 400, mensaje: 'La decisión debe ser Aprobada o Rechazada' });

        if (decision === 'Rechazada' && (!comentario || !comentario.trim()))
            return callback({ status: 400, mensaje: 'El motivo del rechazo es obligatorio' });

        EtapaSolicitud.obtenerPorId(id_etapa, (err, etapas) => {
            if (err) return callback({ status: 500, mensaje: 'Error al consultar la etapa' });
            if (!etapas.length) return callback({ status: 404, mensaje: 'Etapa no encontrada' });

            const etapa = etapas[0];

            if (etapa.estado !== 'Pendiente')
                return callback({ status: 400, mensaje: 'Esta etapa no está disponible para ser resuelta' });

            if (Number(rol) !== Number(etapa.id_rol))
                return callback({ status: 403, mensaje: 'No tiene permisos para resolver esta etapa' });

            const ahora = new Date();

            EtapaSolicitud.actualizar(id_etapa, {
                id_solicitud: etapa.id_solicitud,
                id_rol: etapa.id_rol,
                nombre_etapa: etapa.nombre_etapa,
                orden: etapa.orden,
                estado: decision,
                fecha_inicio: etapa.fecha_inicio,
                fecha_resolucion: ahora,
                decision,
                comentario: comentario || null
            }, err => {
                if (err) return callback({ status: 500, mensaje: 'Error al registrar la decisión' });

                if (decision === 'Rechazada') {
                    return Solicitud.actualizarEstado(etapa.id_solicitud, 'Rechazada', err => {
                        if (err) return callback({ status: 500, mensaje: 'Error al actualizar la solicitud' });
                        callback(null, { mensaje: 'Solicitud rechazada correctamente' });
                    });
                }

                EtapaSolicitud.obtenerPorSolicitud(etapa.id_solicitud, (err, etapasSolicitud) => {
                    if (err) return callback({ status: 500, mensaje: 'Error al consultar las etapas' });

                    const siguiente = etapasSolicitud.find(
                        e => Number(e.orden) === Number(etapa.orden) + 1
                    );

                    if (!siguiente)
                        return finalizarSolicitud(etapa.id_solicitud, callback);

                    EtapaSolicitud.actualizar(siguiente.id_etapa_solicitud, {
                        id_solicitud: siguiente.id_solicitud,
                        id_rol: siguiente.id_rol,
                        nombre_etapa: siguiente.nombre_etapa,
                        orden: siguiente.orden,
                        estado: 'Pendiente',
                        fecha_inicio: ahora,
                        fecha_resolucion: null,
                        decision: null,
                        comentario: null
                    }, err => {
                        if (err) return callback({ status: 500, mensaje: 'No se pudo activar la siguiente etapa' });
                        callback(null, { mensaje: 'Etapa aprobada correctamente' });
                    });
                });
            });
        });
    }
};

function crearEtapas(etapas, index, callback) {
    if (index >= etapas.length) return callback(null);

    EtapaSolicitud.crear(etapas[index], err => {
        if (err) return callback({
            status: 500,
            mensaje: 'Error al crear las etapas de la solicitud'
        });

        crearEtapas(etapas, index + 1, callback);
    });
}

function finalizarSolicitud(id_solicitud, callback) {
    Solicitud.obtenerPorId(id_solicitud, (err, solicitudes) => {
        if (err || !solicitudes.length)
            return callback({ status: 500, mensaje: 'No se pudo consultar la solicitud' });

        const solicitud = solicitudes[0];

        if (Number(solicitud.id_tipo_solicitud) !== 1) {
            return Solicitud.actualizarEstado(id_solicitud, 'Aprobada', err => {
                if (err) return callback({ status: 500, mensaje: 'No se pudo finalizar la solicitud' });
                callback(null, { mensaje: 'Solicitud aprobada correctamente' });
            });
        }

        const inicio = new Date(solicitud.fecha_inicio);
        const fin = new Date(solicitud.fecha_fin);
        const dias = Math.floor((fin - inicio) / 86400000) + 1;
        const anio = inicio.getFullYear();

        SaldoVacaciones.obtenerPorEmpleadoAnio(
            solicitud.id_empleado,
            anio,
            (err, saldos) => {
                if (err || !saldos.length)
                    return callback({ status: 500, mensaje: 'No se pudo consultar el saldo de vacaciones' });

                const saldo = saldos[0];
                const nuevosDias = saldo.dias_utilizados + dias;

                if (nuevosDias > saldo.dias_asignados)
                    return callback({ status: 400, mensaje: 'El saldo de vacaciones es insuficiente' });

                SaldoVacaciones.actualizar(
                    saldo.id_saldo,
                    {
                        dias_asignados: saldo.dias_asignados,
                        dias_utilizados: nuevosDias
                    },
                    err => {
                        if (err)
                            return callback({ status: 500, mensaje: 'No se pudo descontar el saldo de vacaciones' });

                        Solicitud.actualizarEstado(
                            id_solicitud,
                            'Aprobada',
                            err => {
                                if (err)
                                    return callback({ status: 500, mensaje: 'No se pudo finalizar la solicitud' });

                                callback(null, {
                                    mensaje: 'Solicitud aprobada y días de vacaciones descontados',
                                    diasDescontados: dias
                                });
                            }
                        );
                    }
                );
            }
        );
    });
}

module.exports = SolicitudService;