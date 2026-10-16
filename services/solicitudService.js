const Solicitud = require('../models/solicitudModel');
const SaldoVacaciones = require('../models/saldoVacacionesModel');
const EtapaSolicitud = require('../models/etapaSolicitudModel');
const { AuthService } = require('./authService');

const SolicitudService = {

    obtenerMisSolicitudes: (id_empleado, callback) => {
        if (!id_empleado) return callback({ status: 400, mensaje: 'El empleado no está identificado' });

        Solicitud.obtenerPorEmpleado(id_empleado, (err, resultados) => {
            if (err) return callback({ status: 500, mensaje: 'Error interno al consultar las solicitudes' });
            callback(null, resultados);
        });
    },

    // Etapas segun su rol
    obtenerPendientes: (usuario, callback) => {
        const rolesAprobadores = { 'Jefe inmediato': 2, 'Analista de Nómina': 3, 'Gerente': 4 };
        const id_rol = rolesAprobadores[usuario.rol];

        if (!id_rol) return callback({ status: 403, mensaje: 'Su rol no aprueba solicitudes' });

        // el jefe solo ve las de su personal
        const idJefe = id_rol === 2 ? usuario.id_empleado : null;
        if (id_rol === 2 && !idJefe) return callback({ status: 400, mensaje: 'El jefe no tiene empleado asociado' });

        const consultar = (incluirRespaldo) => {
            EtapaSolicitud.obtenerPendientesPorRol(id_rol, idJefe, incluirRespaldo, (err, resultados) => {
                if (err) return callback({ status: 500, mensaje: 'Error al consultar las solicitudes pendientes' });
                callback(null, resultados);
            });
        };

        // el gerente ve los permisos de la analista solo si no hay analista disponible (regla 5)
        if (id_rol !== 4) return consultar(false);

        Solicitud.contarAnalistasDisponibles((err, filas) => {
            if (err) return callback({ status: 500, mensaje: 'Error al verificar disponibilidad de analistas' });
            consultar(filas[0].disponibles === 0);
        });
    },


    // Todas las solicitudes (Asistente, Analista, Gerente)
    obtenerTodas: (callback) => {
        Solicitud.obtenerTodasConDetalle((err, resultados) => {
            if (err) return callback({ status: 500, mensaje: 'Error al consultar las solicitudes' });
            callback(null, resultados);
        });
    },

    // Historial de una solicitud
    obtenerHistorial: (id_solicitud, usuario, callback) => {
        Solicitud.obtenerPorId(id_solicitud, (err, solicitudes) => {
            if (err) return callback({ status: 500, mensaje: 'Error al consultar la solicitud' });
            if (!solicitudes.length) return callback({ status: 404, mensaje: 'Solicitud no encontrada' });

            const solicitud = solicitudes[0];
            const esDueno = Number(solicitud.id_empleado) === Number(usuario.id_empleado);
            const esRRHH = ['Asistente de planilla', 'Analista de Nómina', 'Gerente'].includes(usuario.rol);

            if (!esDueno && !esRRHH)
                return callback({ status: 403, mensaje: 'No tiene permisos para ver esta solicitud' });

            EtapaSolicitud.obtenerHistorial(id_solicitud, (err, etapas) => {
                if (err) return callback({ status: 500, mensaje: 'Error al consultar el historial' });
                callback(null, { solicitud, etapas });
            });
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

        // no se permiten vacaciones en fechas pasadas
        const hoy = new Date().toLocaleDateString('en-CA');
        if (String(fecha_inicio).slice(0, 10) < hoy)
            return callback({ status: 400, mensaje: 'La fecha de inicio no puede ser anterior a hoy' });

        const diasSolicitados = contarDiasHabiles(inicio, fin);

        if (diasSolicitados === 0)
            return callback({ status: 400, mensaje: 'El rango no incluye días hábiles'});

        Solicitud.buscarTraslape(id_empleado, fecha_inicio, fecha_fin, (err, traslapes) => {
            if (err) return callback({ status: 500, mensaje: 'Error al verificar las fechas' });

            if (traslapes.length)
                return callback({ status: 400, mensaje: 'Ya existe una solicitud de vacaciones en ese rango' });

            const anio = inicio.getUTCFullYear();

            SaldoVacaciones.obtenerDiasDisponibles(id_empleado, anio, (err, saldos) => {
                if (err) return callback({ status: 500, mensaje: 'Error al consultar el saldo de vacaciones' });
                if (!saldos.length) return callback({ status: 400, mensaje: 'No existe saldo de vacaciones para ese año' });

                                const saldo = saldos[0];

                Solicitud.obtenerVacacionesPendientes(id_empleado, (err, pendientes) => {
                if (err) return callback({ status: 500, mensaje: 'Error al consultar las solicitudes pendientes' });

                    // dias ya comprometidos en solicitudes que aun no se aprueban
                    const comprometidos = pendientes
                        .filter(p => new Date(p.fecha_inicio).getFullYear() === anio)
                        .reduce((total, p) => total + contarDiasHabiles(new Date(p.fecha_inicio), new Date(p.fecha_fin)), 0);

                    const disponibles = saldo.dias_disponibles - comprometidos;

                if (diasSolicitados > disponibles)
                    return callback({
                         status: 400,
                         mensaje: `No tiene suficientes días. Disponibles: ${disponibles} (${comprometidos} en solicitudes pendientes)`
                        });

                    callback(null, {
                        diasSolicitados,
                        diasDisponibles: disponibles,
                        anio
                    });
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

        // datos de quien solicita, para armar sus etapas
        Solicitud.obtenerSolicitante(id_empleado, (err, filas) => {
        if (err || !filas.length) return callback({ status: 500, mensaje: 'No se pudo consultar al solicitante' });
        const solicitante = filas[0];

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

                        const etapas = armarEtapas(1, solicitante, id);

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

        if (typeof motivo !== 'string' || !motivo.trim())
            return callback({ status: 400, mensaje: 'El motivo es obligatorio para un permiso' });

        if (!fecha_inicio || !fecha_fin)
            return callback({ status: 400, mensaje: 'La fecha de inicio y fin son obligatorias' });

        if ((fecha_inicio && isNaN(new Date(fecha_inicio))) || (fecha_fin && isNaN(new Date(fecha_fin))))
            return callback({ status: 400, mensaje: 'Las fechas no son válidas' });

        if (fecha_inicio && fecha_fin && new Date(fecha_fin) < new Date(fecha_inicio))
            return callback({ status: 400, mensaje: 'La fecha de fin no puede ser anterior a la fecha de inicio' });

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

            const etapas = armarEtapas(2, solicitante, id);

            crearEtapas(etapas, 0, errorEtapas => {
                if (errorEtapas) return callback(errorEtapas);

                callback(null, {
                    mensaje: 'Solicitud de permiso creada correctamente',
                    id_solicitud: id
                });
            });
        });
        });
    },

    resolverEtapa: (id_etapa, rol, decision, comentario, id_empleado, id_usuario, callback) => {
        if (!id_etapa) return callback({ status: 400, mensaje: 'La etapa es obligatoria' });

        if (!['Aprobada', 'Rechazada'].includes(decision))
            return callback({ status: 400, mensaje: 'La decisión debe ser Aprobada o Rechazada' });

        if (decision === 'Rechazada' && (typeof comentario !== 'string' || !comentario.trim()))
            return callback({ status: 400, mensaje: 'El motivo del rechazo es obligatorio' });

        EtapaSolicitud.obtenerPorId(id_etapa, (err, etapas) => {
            if (err) return callback({ status: 500, mensaje: 'Error al consultar la etapa' });
            if (!etapas.length) return callback({ status: 404, mensaje: 'Etapa no encontrada' });

            const etapa = etapas[0];

            if (etapa.estado !== 'Pendiente')
                return callback({ status: 400, mensaje: 'Esta etapa no está disponible para ser resuelta' });

            validarRol(etapa, rol, id_empleado, errRol => {
            if (errRol) return callback(errRol);

            validarJefe(etapa, id_empleado, errJefe => {
            if (errJefe) return callback(errJefe);

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
                comentario: comentario || null,
                id_usuario_responsable: id_usuario
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
            });
        });
    }
};

function armarEtapas(id_tipo, solicitante, id_solicitud) {
    const esAnalista = solicitante.rol === 'Analista de Nómina';
    const esGerente = solicitante.rol === 'Gerente';
    const tieneJefe = !!solicitante.id_supervisor;

    let pasos;

    if (id_tipo === 1) {
        // vacaciones: Analista -> Gerente -> Jefe
        pasos = [
            esAnalista ? null : { id_rol: 3, nombre_etapa: 'Analista de Nómina' },
            esGerente ? null : { id_rol: 4, nombre_etapa: 'Gerente' },
            tieneJefe ? { id_rol: 2, nombre_etapa: 'Jefe inmediato' } : null
        ];
    } else {
        // permiso: Jefe -> Analista (si la solicitante es la analista, revisa la gerente)
        pasos = [
            tieneJefe ? { id_rol: 2, nombre_etapa: 'Jefe inmediato' } : null,
            esAnalista
                ? { id_rol: 4, nombre_etapa: 'Gerente (revisión final)' }
                : { id_rol: 3, nombre_etapa: 'Analista de Nómina' }
        ];
    }

    // quita las omitidas y numera en orden
    return pasos.filter(p => p).map((p, i) => ({
        id_solicitud,
        id_rol: p.id_rol,
        nombre_etapa: p.nombre_etapa,
        orden: i + 1,
        estado: i === 0 ? 'Pendiente' : 'Bloqueada',
        fecha_inicio: i === 0 ? new Date() : null,
        fecha_resolucion: null,
        decision: null,
        comentario: null
    }));
}

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

// nadie resuelve lo suyo; el gerente sustituye a la analista en permisos si no hay analista disponible (regla 5)
function validarRol(etapa, rol, id_empleado, callback) {
    Solicitud.obtenerPorId(etapa.id_solicitud, (err, solicitudes) => {
        if (err || !solicitudes.length) return callback({ status: 500, mensaje: 'No se pudo consultar la solicitud' });

        const solicitud = solicitudes[0];

        if (Number(solicitud.id_empleado) === Number(id_empleado))
            return callback({ status: 403, mensaje: 'No puede resolver su propia solicitud' });

        if (Number(rol) === Number(etapa.id_rol)) return callback(null);

        const esRespaldo = Number(rol) === 4 && Number(etapa.id_rol) === 3;
        if (!esRespaldo) return callback({ status: 403, mensaje: 'No tiene permisos para resolver esta etapa' });

        if (Number(solicitud.id_tipo_solicitud) !== 2)
            return callback({ status: 403, mensaje: 'El Gerente solo puede sustituir a la Analista en permisos' });

        Solicitud.contarAnalistasDisponibles((err, filas) => {
            if (err) return callback({ status: 500, mensaje: 'Error al verificar disponibilidad de analistas' });

            if (filas[0].disponibles > 0)
                return callback({ status: 403, mensaje: 'Hay una Analista de Nómina disponible para esta revisión' });

            callback(null);
        });
    });
}

// valida la jerarquia
function validarJefe(etapa, idJefe, callback) {
    if (Number(etapa.id_rol) !== 2) return callback(null);

    Solicitud.obtenerPorId(etapa.id_solicitud, (err, solicitudes) => {
        if (err || !solicitudes.length) return callback({ status: 500, mensaje: 'No se pudo consultar la solicitud' });

        AuthService.esJefeDe(idJefe, solicitudes[0].id_empleado)
            .then(esJefe => {
                if (!esJefe) return callback({ status: 403, mensaje: 'Solo puede resolver solicitudes de su personal a cargo' });
                callback(null);
            })
            .catch(() => callback({ status: 500, mensaje: 'Error al validar el jefe inmediato' }));
    });
}

// cuenta dias de lunes a sabado entre dos fechas (incluidas)
function contarDiasHabiles(inicio, fin) {
    let dias = 0;
    const actual = new Date(inicio);

    while (actual <= fin) {
        if (actual.getUTCDay() !== 0) dias++;
        actual.setUTCDate(actual.getUTCDate() + 1);
    }
    return dias;
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
        const dias = contarDiasHabiles(inicio, fin);
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
                    return Solicitud.actualizarEstado(id_solicitud, 'Rechazada', () =>
                        callback({ status: 400, mensaje: 'Saldo insuficiente: la solicitud fue rechazada automáticamente' }));

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