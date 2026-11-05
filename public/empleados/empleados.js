
'use strict';

const token = localStorage.getItem('token');

const tablaEmpleados = document.getElementById('tablaEmpleados');
const totalEmpleados = document.getElementById('totalEmpleados');
const mensaje = document.getElementById('mensaje');
const buscarEmpleado = document.getElementById('buscarEmpleado');
const filtroCargo = document.getElementById('filtroCargo');
const filtroEstado = document.getElementById('filtroEstado');

const btnNuevoEmpleado = document.getElementById('btnNuevoEmpleado');
const panelNuevoEmpleado = document.getElementById('panelNuevoEmpleado');
const formNuevoEmpleado = document.getElementById('formNuevoEmpleado');
const mensajeFormulario = document.getElementById('mensajeFormulario');
const btnGuardarEmpleado = document.getElementById('btnGuardarEmpleado');

const usuarioSelect = document.getElementById('nuevoUsuario');
const supervisorSelect = document.getElementById('nuevoSupervisor');

const modalDesactivar = document.getElementById('modalDesactivar');
const modalConfirmarDesactivar = document.getElementById('modalConfirmarDesactivar');
const modalCancelarDesactivar = document.getElementById('modalCancelarDesactivar');
const modalDetalleEmpleado = document.getElementById('modalDetalleEmpleado');

let empleadosActuales = [];
let empleadoEnEdicion = null;
let usuarioSesion = {};
let rolSesion = '';
let modalResolver = null;
let focoAnteriorModal = null;

try {
    usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}') || {};
    rolSesion = usuarioSesion.rol || '';
} catch (_) {
    // Sesión inválida.
}

// Si el rol no puede ver empleados, se regresa al dashboard
const ROLES_EMPLEADOS = ['Administrador de TI', 'Asistente de planilla', 'Analista de Nómina', 'Gerente'];

if (!ROLES_EMPLEADOS.includes(rolSesion)) {
    window.location.replace('/dashboard/dashboard.html');
}

const puedeCrear = rolSesion === 'Administrador de TI' ||
    rolSesion === 'Asistente de planilla';

const puedeCambiarEstado = rolSesion === 'Administrador de TI';


/* INICIALIZACIÓN */

if (puedeCrear) {
    btnNuevoEmpleado.disabled = false;

    btnNuevoEmpleado.addEventListener('click', abrirFormulario);

    document.getElementById('btnCancelarEmpleado')
        .addEventListener('click', cerrarFormulario);

    formNuevoEmpleado.addEventListener('submit', guardarEmpleado);
}

if (!token) {
    window.location.replace('/login/index.html');
} else {
    cargarEmpleados();
}

buscarEmpleado.addEventListener('input', filtrarEmpleados);
filtroCargo.addEventListener('change', filtrarEmpleados);
filtroEstado.addEventListener('change', filtrarEmpleados);

document.getElementById('nombreUsuario').textContent =
    usuarioSesion.nombre || usuarioSesion.usuario || 'Usuario';

document.getElementById('cerrarSesion').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
    } catch (_) {
        // Cierra la sesión local incluso si falla la petición.
    }

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login/index.html';
});


/* CONSULTA DE EMPLEADOS */

async function cargarEmpleados() {
    tablaEmpleados.innerHTML = '<tr><td colspan="6" class="texto-vacio">Cargando empleados...</td></tr>';

    mostrarMensaje('Consultando los empleados registrados...');

    try {
        const respuesta = await fetch('/api/empleados', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (respuesta.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');

            window.location.replace('/login/index.html');
            return;
        }

        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                datos.mensaje ||
                'No se pudieron consultar los empleados.'
            );
        }

        if (!Array.isArray(datos)) {
            throw new Error('La API devolvió un formato inesperado.');
        }

        empleadosActuales = datos;

        const cargoSeleccionado = filtroCargo.value;
        const cargos = [...new Set(datos.map(e => e.cargo).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'es'));

        filtroCargo.replaceChildren(new Option('Todos', ''));
        cargos.forEach(cargo => filtroCargo.add(new Option(cargo, cargo)));
        filtroCargo.value = cargos.includes(cargoSeleccionado) ? cargoSeleccionado : '';

        buscarEmpleado.disabled = false;
        filtroCargo.disabled = false;
        filtroEstado.disabled = false;

        // El nombre del supervisor se obtiene de los empleados cargados.
        const empleadosPorId = new Map(
            datos.map(e => [Number(e.id_empleado), e])
        );

        tablaEmpleados.replaceChildren();

        if (datos.length === 0) {
            tablaEmpleados.appendChild(
                filaVacia('No hay empleados registrados.')
            );
        } else {
            datos.forEach(empleado => {
                const supervisor = empleadosPorId.get(
                    Number(empleado.id_supervisor)
                );

                const nombreSupervisor = supervisor
                    ? nombreCompleto(supervisor)
                    : (empleado.id_supervisor ? 'No disponible' : 'Sin asignar');

                const activo = empleado.estado === true ||
                    empleado.estado === 1 ||
                    empleado.estado === '1' ||
                    empleado.estado === 'activo';

                const fila = document.createElement('tr');

                agregarCelda(fila, nombreCompleto(empleado));
                agregarCelda(fila, empleado.cargo || 'Sin cargo');
                agregarCelda(fila, empleado.correo || 'Sin correo');
                agregarCelda(fila, nombreSupervisor);

                const celdaEstado = document.createElement('td');
                const etiquetaEstado = document.createElement('span');

                etiquetaEstado.className = `estado ${activo ? 'activo' : 'inactivo'}`;
                etiquetaEstado.textContent = activo ? 'Activo' : 'Inactivo';

                celdaEstado.appendChild(etiquetaEstado);
                fila.appendChild(celdaEstado);

                const acciones = document.createElement('td');

                const verDetalle = document.createElement('button');

                verDetalle.type = 'button';
                verDetalle.className = 'btn btn-secundario btn-editar';
                verDetalle.textContent = 'Ver detalle';
                verDetalle.setAttribute('aria-label', `Ver detalle de ${nombreCompleto(empleado)}`);
                verDetalle.addEventListener('click', () => abrirDetalleEmpleado(empleado));
                acciones.appendChild(verDetalle);

                if (puedeCrear) {
                    const editar = document.createElement('button');

                    editar.type = 'button';
                    editar.className = 'btn btn-secundario btn-editar btn-accion-editar';
                    editar.textContent = 'Editar';

                    editar.setAttribute(
                        'aria-label',
                        `Editar a ${nombreCompleto(empleado)}`
                    );

                    editar.addEventListener(
                        'click',
                        () => abrirFormulario(empleado)
                    );

                    acciones.appendChild(editar);
                }

                if (puedeCambiarEstado) {
                    const cambiarEstado = document.createElement('button');
                    const accion = activo ? 'Desactivar' : 'Reactivar';

                    cambiarEstado.type = 'button';
                    cambiarEstado.className = activo ? 'btn btn-desactivar' : 'btn btn-reactivar';
                    cambiarEstado.textContent = accion;
                    cambiarEstado.setAttribute('aria-label', `${accion} a ${nombreCompleto(empleado)}`);

                    cambiarEstado.addEventListener('click', () => {
                        if (activo) {
                            desactivarEmpleado(empleado, cambiarEstado);
                        } else {
                            reactivarEmpleado(empleado, cambiarEstado);
                        }
                    });

                    acciones.appendChild(cambiarEstado);
                }

                if (!puedeCrear && !puedeCambiarEstado) {
                    verDetalle.title = 'Consulta de empleado (solo lectura)';
                }

                fila.appendChild(acciones);
                tablaEmpleados.appendChild(fila);
            });
        }

        totalEmpleados.textContent = String(datos.length);

        mostrarMensaje(
            `${datos.length} empleado(s) cargado(s) correctamente.`,
            'exito'
        );
        filtrarEmpleados();
    } catch (error) {
        totalEmpleados.textContent = '0';

        tablaEmpleados.replaceChildren(
            filaVacia('No fue posible cargar los empleados.')
        );

        mostrarMensaje(error.message, 'error');
    }
}


/* FUNCIONES AUXILIARES */

function filtrarEmpleados() {
    const busqueda = buscarEmpleado.value.trim().toLocaleLowerCase('es');
    const cargo = filtroCargo.value;
    const estado = filtroEstado.value;

    const filaAnterior = document.getElementById('filaSinResultados');
    if (filaAnterior) filaAnterior.remove();

    const filas = [...tablaEmpleados.rows].filter(fila => fila.cells.length === 6);
    let visibles = 0;

    filas.forEach(fila => {
        const nombreFila = fila.cells[0].textContent.toLocaleLowerCase('es');
        const cargoFila = fila.cells[1].textContent;
        const estadoFila = fila.cells[4].textContent.trim().toLocaleLowerCase('es');

        const coincide = nombreFila.includes(busqueda) &&
            (!cargo || cargoFila === cargo) &&
            (!estado || estadoFila === estado);

        fila.hidden = !coincide;
        if (coincide) visibles++;
    });

    if (filas.length > 0 && visibles === 0) {
        const vacia = filaVacia('No hay empleados que coincidan con los filtros.');
        vacia.id = 'filaSinResultados';
        tablaEmpleados.appendChild(vacia);
    }

    totalEmpleados.textContent = String(visibles);
}

function nombreCompleto(empleado) {
    return [empleado.nombre, empleado.apellido]
        .filter(Boolean)
        .join(' ') || 'Sin nombre';
}

function agregarCelda(fila, valor) {
    const celda = document.createElement('td');

    celda.textContent = String(valor);
    fila.appendChild(celda);
}

function filaVacia(texto) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');

    celda.colSpan = 6;
    celda.className = 'texto-vacio';
    celda.textContent = texto;

    fila.appendChild(celda);

    return fila;
}

function mostrarMensaje(texto, tipo = '') {
    mensaje.className = `mensaje ${tipo}`.trim();
    mensaje.textContent = texto;
}


/* FORMULARIO DE EMPLEADOS */

async function abrirFormulario(empleado = null) {
    if (!puedeCrear) return;

    empleadoEnEdicion = empleado &&
        typeof empleado === 'object' &&
        empleado.id_empleado
        ? empleado
        : null;

    formNuevoEmpleado.reset();

    document.getElementById('tituloNuevoEmpleado').textContent =
        empleadoEnEdicion ? 'Editar empleado' : 'Registrar empleado';

    btnGuardarEmpleado.textContent = empleadoEnEdicion
        ? 'Guardar cambios'
        : 'Guardar empleado';

    if (empleadoEnEdicion) {
        document.getElementById('nuevoNombre').value =
            empleadoEnEdicion.nombre || '';

        document.getElementById('nuevoApellido').value =
            empleadoEnEdicion.apellido || '';

        document.getElementById('nuevoCorreo').value =
            empleadoEnEdicion.correo || '';

        document.getElementById('nuevoCargo').value =
            empleadoEnEdicion.cargo || '';

        const fecha = empleadoEnEdicion.fecha_ingreso;

        document.getElementById('nuevoFecha').value = fecha
            ? String(fecha).slice(0, 10)
            : '';
    }

    mensajeFormulario.hidden = true;
    panelNuevoEmpleado.hidden = false;
    btnNuevoEmpleado.disabled = true;

    supervisorSelect.replaceChildren(
        new Option('Sin asignar', '')
    );

    empleadosActuales
        .filter(e =>
            Number(e.id_empleado) !== Number(empleadoEnEdicion?.id_empleado) &&
            (
                e.estado === true ||
                e.estado === 1 ||
                e.estado === '1' ||
                e.estado === 'activo'
            )
        )
        .forEach(e => {
            supervisorSelect.add(
                new Option(nombreCompleto(e), String(e.id_empleado))
            );
        });

    if (empleadoEnEdicion && empleadoEnEdicion.id_supervisor) {
        const supervisorId = String(empleadoEnEdicion.id_supervisor);

        if (![...supervisorSelect.options].some(op => op.value === supervisorId)) {
            const anterior = empleadosActuales.find(
                e => String(e.id_empleado) === supervisorId
            );

            supervisorSelect.add(
                new Option(
                    anterior ? nombreCompleto(anterior) : 'Supervisor anterior',
                    supervisorId
                )
            );
        }

        supervisorSelect.value = supervisorId;
    }

    usuarioSelect.replaceChildren(
        new Option('Cargando usuarios...', '')
    );

    usuarioSelect.disabled = true;
    btnGuardarEmpleado.disabled = true;

    try {
        const respuesta = await fetch('/api/usuarios', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            if (respuesta.status === 403) {
                throw new Error(
                    'Tu rol permite registrar empleados, pero el catálogo de usuarios está restringido al Administrador TI. Se necesita coordinar ese permiso con el equipo.'
                );
            }

            throw new Error(
                datos.error || 'No fue posible consultar los usuarios.'
            );
        }

        if (!Array.isArray(datos)) {
            throw new Error(
                'La lista de usuarios tiene un formato inesperado.'
            );
        }

        const ocupados = new Set(
            empleadosActuales.map(e => Number(e.id_usuario))
        );

        const disponibles = datos.filter(u =>
            (
                Number(u.id_usuario) === Number(empleadoEnEdicion?.id_usuario) ||
                !ocupados.has(Number(u.id_usuario))
            ) &&
            (
                u.estado === true ||
                u.estado === 1 ||
                u.estado === '1' ||
                u.estado === 'activo' ||
                Number(u.id_usuario) === Number(empleadoEnEdicion?.id_usuario)
            )
        );

        usuarioSelect.replaceChildren(
            new Option('Seleccionar usuario', '')
        );

        disponibles.forEach(u => {
            usuarioSelect.add(
                new Option(u.usuario, String(u.id_usuario))
            );
        });

        if (empleadoEnEdicion) {
            usuarioSelect.value = String(empleadoEnEdicion.id_usuario);
        }

        if (!disponibles.length) {
            throw new Error(
                'No hay usuarios activos disponibles sin empleado asociado.'
            );
        }

        usuarioSelect.disabled = false;
        btnGuardarEmpleado.disabled = false;
    } catch (error) {
        usuarioSelect.replaceChildren(
            new Option('No disponible', '')
        );

        avisoFormulario(error.message, 'error');
    }

    panelNuevoEmpleado.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function cerrarFormulario() {
    empleadoEnEdicion = null;
    panelNuevoEmpleado.hidden = true;
    btnNuevoEmpleado.disabled = !puedeCrear;

    formNuevoEmpleado.reset();
}

function avisoFormulario(texto, tipo = '') {
    mensajeFormulario.hidden = false;
    mensajeFormulario.className = `mensaje ${tipo}`.trim();
    mensajeFormulario.textContent = texto;
}


/* REGISTRO Y ACTUALIZACIÓN */

async function guardarEmpleado(evento) {
    evento.preventDefault();

    if (!formNuevoEmpleado.reportValidity()) return;

    const datos = Object.fromEntries(
        new FormData(formNuevoEmpleado).entries()
    );

    const empleado = {
        id_usuario: Number(datos.id_usuario),
        id_supervisor: datos.id_supervisor
            ? Number(datos.id_supervisor)
            : null,
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo.trim(),
        cargo: datos.cargo.trim(),
        fecha_ingreso: datos.fecha_ingreso
    };

    const editando = Boolean(empleadoEnEdicion);
    const idEdicion = empleadoEnEdicion?.id_empleado;

    btnGuardarEmpleado.disabled = true;

    avisoFormulario(
        editando ? 'Actualizando empleado...' : 'Guardando empleado...'
    );

    try {
        const respuesta = await fetch(
            editando
                ? `/api/empleados/${encodeURIComponent(idEdicion)}`
                : '/api/empleados',
            {
                method: editando ? 'PUT' : 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(empleado)
            }
        );

        const resultado = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                resultado.mensaje ||
                'No fue posible guardar el empleado.'
            );
        }

        cerrarFormulario();
        await cargarEmpleados();

        mostrarMensaje(
            editando
                ? 'Empleado actualizado correctamente.'
                : 'Empleado registrado correctamente.',
            'exito'
        );
    } catch (error) {
        avisoFormulario(error.message, 'error');
        btnGuardarEmpleado.disabled = false;
    }
}


/* DESACTIVACIÓN DE EMPLEADOS */

async function desactivarEmpleado(empleado, boton) {
    if (!puedeCambiarEstado || boton.disabled) return;

    const nombre = nombreCompleto(empleado);

    if (!await confirmarCambioEstado(nombre, false)) return;

    boton.disabled = true;

    mostrarMensaje(`Desactivando a ${nombre}...`);

    try {
        const respuesta = await fetch(
            `/api/empleados/${encodeURIComponent(empleado.id_empleado)}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const resultado = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                resultado.mensaje ||
                'No fue posible desactivar al empleado.'
            );
        }

        cerrarFormulario();
        await cargarEmpleados();

        mostrarMensaje(
            `${nombre} fue desactivado correctamente.`,
            'exito'
        );
    } catch (error) {
        boton.disabled = false;
        mostrarMensaje(error.message, 'error');
    }
}


/* REACTIVACIÓN DE EMPLEADOS */

async function reactivarEmpleado(empleado, boton) {
    if (!puedeCambiarEstado || boton.disabled) return;

    const nombre = nombreCompleto(empleado);
    if (!await confirmarCambioEstado(nombre, true)) return;

    boton.disabled = true;
    mostrarMensaje(`Reactivando a ${nombre}...`);

    try {
        const respuesta = await fetch(
            `/api/empleados/${encodeURIComponent(empleado.id_empleado)}/reactivar`,
            {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        const resultado = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) {
            throw new Error(resultado.error || 'No fue posible reactivar al empleado.');
        }

        cerrarFormulario();
        await cargarEmpleados();
        mostrarMensaje(`${nombre} fue reactivado correctamente.`, 'exito');
    } catch (error) {
        boton.disabled = false;
        mostrarMensaje(error.message, 'error');
    }
}


/* MODAL DE CONFIRMACIÓN */

function cerrarModalDesactivar(confirmado) {
    if (!modalResolver) return;

    const resolver = modalResolver;

    modalResolver = null;
    modalDesactivar.hidden = true;

    document.removeEventListener('keydown', manejarTeclasModal);

    if (focoAnteriorModal && focoAnteriorModal.isConnected) {
        focoAnteriorModal.focus();
    }

    focoAnteriorModal = null;

    resolver(confirmado);
}

function manejarTeclasModal(evento) {
    if (evento.key === 'Escape') {
        evento.preventDefault();
        cerrarModalDesactivar(false);
    } else if (evento.key === 'Tab') {
        // Mantiene el foco dentro del diálogo mientras está abierto.
        const elementos = [
            modalCancelarDesactivar,
            modalConfirmarDesactivar
        ];

        const actual = elementos.indexOf(document.activeElement);

        if (evento.shiftKey && actual <= 0) {
            evento.preventDefault();
            modalConfirmarDesactivar.focus();
        } else if (!evento.shiftKey && actual === elementos.length - 1) {
            evento.preventDefault();
            modalCancelarDesactivar.focus();
        }
    }
}

modalCancelarDesactivar.addEventListener(
    'click',
    () => cerrarModalDesactivar(false)
);

modalConfirmarDesactivar.addEventListener(
    'click',
    () => cerrarModalDesactivar(true)
);

modalDesactivar.addEventListener('click', evento => {
    if (evento.target === modalDesactivar) {
        cerrarModalDesactivar(false);
    }
});

function confirmarCambioEstado(nombre, reactivar) {
    if (modalResolver) return Promise.resolve(false);

    const titulo = document.getElementById('modalDesactivarTitulo');
    const descripcion = document.getElementById('modalDesactivarDescripcion');
    const nombreElemento = document.getElementById('modalNombreEmpleado');
    const icono = modalDesactivar.querySelector('.modal-icono');

    titulo.textContent = reactivar ? '¿Reactivar empleado?' : '¿Desactivar empleado?';
    descripcion.replaceChildren(
        document.createTextNode(reactivar ? '¿Deseas reactivar a ' : '¿Deseas desactivar a '),
        nombreElemento,
        document.createTextNode(reactivar
            ? '? Su registro volverá a estar activo.'
            : '? Su registro permanecerá en el sistema, pero su estado cambiará a inactivo.')
    );
    nombreElemento.textContent = nombre;
    icono.textContent = reactivar ? '✓' : '!';
    modalDesactivar.classList.toggle('modal-reactivar', reactivar);
    modalConfirmarDesactivar.classList.toggle('btn-peligro', !reactivar);
    modalConfirmarDesactivar.classList.toggle('btn-activacion', reactivar);
    modalConfirmarDesactivar.textContent = reactivar ? 'Reactivar empleado' : 'Desactivar empleado';

    focoAnteriorModal = document.activeElement;
    modalDesactivar.hidden = false;
    modalCancelarDesactivar.focus();

    document.addEventListener('keydown', manejarTeclasModal);

    return new Promise(resolve => {
        modalResolver = resolve;
    });
}


/* DETALLE DEL EMPLEADO */

let focoAnteriorDetalle = null;
let consultaSaldoActual = 0;

async function cargarSaldoVacaciones(idEmpleado, numeroConsulta) {
    const anio = new Date().getFullYear();
    const mensajeSaldo = document.getElementById('mensajeVacaciones');

    try {
        const respuesta = await fetch(
            `/api/empleados/${encodeURIComponent(idEmpleado)}/saldo-vacaciones?anio=${anio}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (respuesta.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.replace('/login/index.html');
            return;
        }

        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(datos.error || 'No fue posible consultar el saldo de vacaciones.');
        }

        if (numeroConsulta !== consultaSaldoActual) return;

        if (!datos.registrado) {
            mensajeSaldo.textContent = `No hay saldo registrado para ${anio}.`;
            return;
        }

        document.getElementById('vacacionesAsignadas').textContent = String(datos.dias_asignados);
        document.getElementById('vacacionesUtilizadas').textContent = String(datos.dias_utilizados);
        document.getElementById('vacacionesDisponibles').textContent = String(datos.dias_disponibles);
        mensajeSaldo.textContent = '';
    } catch (error) {
        if (numeroConsulta !== consultaSaldoActual) return;
        mensajeSaldo.textContent = error.message;
    }
}

function abrirDetalleEmpleado(empleado) {
    const supervisor = empleadosActuales.find(
        e => Number(e.id_empleado) === Number(empleado.id_supervisor)
    );

    const activo = empleado.estado === true ||
        empleado.estado === 1 ||
        empleado.estado === '1' ||
        empleado.estado === 'activo';

    const fecha = empleado.fecha_ingreso
        ? String(empleado.fecha_ingreso).slice(0, 10)
        : 'No registrada';

    const valores = {
        detalleNombre: nombreCompleto(empleado),
        detalleCorreo: empleado.correo || 'No registrado',
        detalleCargo: empleado.cargo || 'No registrado',
        detalleFecha: fecha,
        detalleSupervisor: supervisor ? nombreCompleto(supervisor) : (empleado.id_supervisor ? 'No disponible' : 'Sin asignar'),
        detalleEstado: activo ? 'Activo' : 'Inactivo'
    };

    Object.entries(valores).forEach(([id, valor]) => {
        document.getElementById(id).textContent = valor;
    });

    const numeroConsulta = ++consultaSaldoActual;
    document.getElementById('detalleAnioVacaciones').textContent = `(${new Date().getFullYear()})`;
    document.getElementById('vacacionesAsignadas').textContent = '—';
    document.getElementById('vacacionesUtilizadas').textContent = '—';
    document.getElementById('vacacionesDisponibles').textContent = '—';
    document.getElementById('mensajeVacaciones').textContent = 'Consultando saldo...';

    cargarSaldoVacaciones(empleado.id_empleado, numeroConsulta);

    focoAnteriorDetalle = document.activeElement;
    modalDetalleEmpleado.hidden = false;
    document.getElementById('cerrarDetalleEmpleado').focus();
    document.addEventListener('keydown', manejarTeclasDetalle);
}

function cerrarDetalleEmpleado() {
    consultaSaldoActual++;
    modalDetalleEmpleado.hidden = true;
    document.removeEventListener('keydown', manejarTeclasDetalle);

    if (focoAnteriorDetalle && focoAnteriorDetalle.isConnected) {
        focoAnteriorDetalle.focus();
    }

    focoAnteriorDetalle = null;
}

function manejarTeclasDetalle(evento) {
    if (evento.key === 'Escape') {
        evento.preventDefault();
        cerrarDetalleEmpleado();
    } else if (evento.key === 'Tab') {
        evento.preventDefault();
        document.getElementById('cerrarDetalleEmpleado').focus();
    }
}

document.getElementById('cerrarDetalleEmpleado').addEventListener('click', cerrarDetalleEmpleado);

modalDetalleEmpleado.addEventListener('click', evento => {
    if (evento.target === modalDetalleEmpleado) cerrarDetalleEmpleado();
});
