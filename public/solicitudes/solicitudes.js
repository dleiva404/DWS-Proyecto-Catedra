const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token) window.location.href = '/login/index.html';

document.getElementById('nombreUsuario').textContent = usuario.nombre || usuario.usuario || 'Usuario';

if (['Jefe inmediato', 'Analista de Nómina', 'Gerente'].includes(usuario.rol)) {
    document.getElementById('navAprobaciones').style.display = '';
}

const modal = document.getElementById('modal');
const tipo = document.getElementById('tipo');
const form = document.getElementById('formSolicitud');
const mensaje = document.getElementById('mensaje');
const fechas = document.getElementById('camposFechas');
const fechaInicio = document.getElementById('fechaInicio');
const fechaFin = document.getElementById('fechaFin');
const motivo = document.getElementById('motivo');
const archivo = document.getElementById('archivo');

document.getElementById('btnNueva').addEventListener('click', () => {
    abrirModal();
    tipo.value = '';
    actualizarFormulario();
});

document.getElementById('cerrarModal').addEventListener('click', cerrarModal);

modal.addEventListener('click', e => {
    if (e.target === modal) cerrarModal();
});

tipo.addEventListener('change', actualizarFormulario);

function abrirModal() {
    modal.classList.remove('oculto');
    mensaje.textContent = '';
    mensaje.className = 'mensaje';
}

function cerrarModal() {
    modal.classList.add('oculto');
    form.reset();
    mensaje.textContent = '';
    mensaje.className = 'mensaje';
    actualizarFormulario();
}

function actualizarFormulario() {
    const valor = tipo.value;

    const llevaFechas = valor === '1' || valor === '2';

    fechas.style.display = llevaFechas ? 'grid' : 'none';

    fechaInicio.required = llevaFechas;
    fechaFin.required = llevaFechas;

    motivo.required = valor === '2' || valor === '4';

    if (valor === '3') {
        motivo.placeholder = 'Información adicional (opcional)...';
    } else if (valor === '4') {
        motivo.placeholder = 'Describe el problema que necesitas reportar...';
    } else {
        motivo.placeholder = 'Escribe el motivo de la solicitud...';
    }
}

form.addEventListener('submit', async e => {
    e.preventDefault();

    const valor = tipo.value;

    if (!valor) {
        mostrarMensaje('Selecciona un tipo de solicitud.', 'error');
        return;
    }

    if (valor === '3' || valor === '4') {
        mostrarMensaje(
            valor === '3'
                ? 'La Constancia Salarial estará disponible próximamente.'
                : 'El Soporte Técnico estará disponible próximamente.',
            'error'
        );
        return;
    }

    // Validacion para fechas en blanco si es Vacaciones o Permiso
    if ((valor === '1' || valor === '2') && (!fechaInicio.value || !fechaFin.value)) {
        mostrarMensaje('Por favor, completa las fechas de inicio y fin.', 'error');
        return;
    }

    // Validacion si la fecha de inicio es anterior a hoy
    if (fechaInicio.value) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicio = new Date(fechaInicio.value + 'T00:00:00');
        if (inicio < hoy) {
            mostrarMensaje('La fecha de inicio no puede ser anterior a hoy', 'error');
            return;
        }
    }

    // Validacion para fecha fin menor que fecha inicio
    if (fechaInicio.value && fechaFin.value) {
        const inicio = new Date(fechaInicio.value + 'T00:00:00');
        const fin = new Date(fechaFin.value + 'T00:00:00');
        if (fin < inicio) {
            mostrarMensaje('La fecha de fin no puede ser menor que la fecha de inicio.', 'error');
            return;
        }
    }

    // Validacion para Permiso que requiere Motivo obligatoriamente
    if (valor === '2' && !motivo.value.trim()) {
        mostrarMensaje('El motivo es obligatorio para este tipo de solicitud.', 'error');
        return;
    }

    mostrarMensaje('Creando solicitud...', '');

    const datos = new FormData();

    datos.append('id_tipo_solicitud', Number(valor));
    datos.append('fecha_inicio', fechaInicio.value || '');
    datos.append('fecha_fin', fechaFin.value || '');
    datos.append('motivo', motivo.value.trim());

    if (archivo.files.length > 0) {
        datos.append('archivo', archivo.files[0]);
    }

    try {
        const respuesta = await fetch('/api/solicitudes', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: datos
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login/index.html';
            return;
        }

        if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo crear la solicitud');

        mostrarMensaje(resultado.mensaje || 'Solicitud creada correctamente', 'exito');

        setTimeout(() => {
            cerrarModal();
            cargarSolicitudes();
        }, 800);

    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
});

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
}

async function cargarSolicitudes() {
    try {
        const respuesta = await fetch('/api/solicitudes/mis-solicitudes', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login/index.html';
            return;
        }

        if (respuesta.status === 400) {
            document.getElementById('tablaSolicitudes').innerHTML = '<tr><td colspan="9">Tu usuario no está registrado como empleado, por eso no tiene solicitudes propias.</td></tr>';
            return;
        }

        if (!respuesta.ok) throw new Error();

        const solicitudes = await respuesta.json();

        document.getElementById('pendientes').textContent = solicitudes.filter(s => s.estado === 'Pendiente').length;
        document.getElementById('aprobadas').textContent = solicitudes.filter(s => s.estado === 'Aprobada').length;
        document.getElementById('rechazadas').textContent = solicitudes.filter(s => s.estado === 'Rechazada').length;

        const tabla = document.getElementById('tablaSolicitudes');

        if (!solicitudes.length) {
            tabla.innerHTML = '<tr><td colspan="9">No tienes solicitudes registradas.</td></tr>';
            return;
        }

        tabla.innerHTML = solicitudes.map(s => {
            const id = Number(s.id_tipo_solicitud);
            const tipo = id === 1 ? 'Vacaciones' : id === 2 ? 'Permiso' : id === 3 ? 'Constancia Salarial' : 'Soporte Técnico';
            const estado = s.estado.toLowerCase();

            return `
                <tr>
                    <td>${s.id_solicitud}</td>
                    <td>${tipo}</td>
                    <td>${formatearFecha(s.fecha_solicitud)}</td>
                    <td>${formatearFecha(s.fecha_inicio)}</td>
                    <td>${formatearFecha(s.fecha_fin)}</td>
                    <td>${s.motivo ? escaparHTML(s.motivo) : '-'}</td>
                    <td><span class="estado estado-${estado}">${s.estado}</span></td>
                    <td>${s.archivo_adjunto ? `<button type="button" class="btn-adjunto" data-id="${s.id_solicitud}">Ver archivo</button>` : '-'}</td>
                    <td><button type="button" class="btn-adjunto btn-historial" data-id="${s.id_solicitud}">Ver historial</button></td>
                </tr>`;
        }).join('');

    } catch (error) {
        document.getElementById('tablaSolicitudes').innerHTML = '<tr><td colspan="9">No se pudieron cargar las solicitudes.</td></tr>';
    }
}

async function abrirAdjunto(id) {
    const nuevaVentana = window.open('', '_blank');

    try {
        const respuesta = await fetch(`/api/solicitudes/${id}/archivo`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!respuesta.ok) {
            const resultado = await respuesta.json();
            throw new Error(resultado.error || 'No se pudo abrir el archivo.');
        }

        const archivo = await respuesta.blob();
        const url = URL.createObjectURL(archivo);

        if (nuevaVentana) {
            nuevaVentana.location.href = url;
        } else {
            URL.revokeObjectURL(url);
            throw new Error('Permite las ventanas emergentes para ver el archivo.');
        }

        setTimeout(() => URL.revokeObjectURL(url), 60000);

    } catch (error) {
        if (nuevaVentana) nuevaVentana.close();
        alert(error.message);
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-SV');
}

document.getElementById('cerrarSesion').addEventListener('click', async () => {

    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (e) {
    }

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login/index.html';
});

const params = new URLSearchParams(window.location.search);
const tipoUrl = params.get('tipo');

if (tipoUrl) {
    abrirModal();

    const tipos = {
        vacaciones: '1',
        permiso: '2',
        constancia: '3',
        soporte: '4'
    };

    tipo.value = tipos[tipoUrl] || '';
    actualizarFormulario();
}

function escaparHTML(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

actualizarFormulario();
cargarSolicitudes();

document.getElementById('tablaSolicitudes').addEventListener('click', e => {
    const botonHistorial = e.target.closest('.btn-historial');

    if (botonHistorial) {
        verHistorial(botonHistorial.dataset.id);
        return;
    }

    const boton = e.target.closest('.btn-adjunto');

    if (boton) {
        abrirAdjunto(boton.dataset.id);
    }
});

async function verHistorial(id) {
    const modalHistorial = document.getElementById('modalHistorial');
    const tablaHistorial = document.getElementById('tablaHistorial');
    const resumen = document.getElementById('historialResumen');

    document.getElementById('historialId').textContent = '#' + id;
    resumen.textContent = '';
    tablaHistorial.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
    modalHistorial.classList.remove('oculto');

    try {
        const respuesta = await fetch(`/api/solicitudes/${id}/historial`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) throw new Error(datos.error || 'No se pudo cargar el historial.');

        const pendiente = datos.etapas.find(etapa => etapa.estado === 'Pendiente');

        resumen.textContent = pendiente
            ? 'En espera de: ' + pendiente.nombre_etapa
            : 'Estado final: ' + datos.solicitud.estado;

        if (!datos.etapas.length) {
            tablaHistorial.innerHTML = '<tr><td colspan="6">Esta solicitud no tiene etapas registradas.</td></tr>';
            return;
        }

        tablaHistorial.innerHTML = datos.etapas.map(etapa => `
            <tr>
                <td>${etapa.orden}</td>
                <td>${escaparHTML(etapa.nombre_etapa)}</td>
                <td><span class="estado estado-${etapa.estado.toLowerCase()}">${etapa.estado}</span></td>
                <td>${etapa.responsable ? escaparHTML(etapa.responsable) : '-'}</td>
                <td>${formatearFecha(etapa.fecha_resolucion)}</td>
                <td>${etapa.comentario ? escaparHTML(etapa.comentario) : '-'}</td>
            </tr>
        `).join('');

    } catch (error) {
        tablaHistorial.innerHTML = `<tr><td colspan="6">${escaparHTML(error.message)}</td></tr>`;
    }
}

document.getElementById('cerrarHistorial').addEventListener('click', () => {
    document.getElementById('modalHistorial').classList.add('oculto');
});

document.getElementById('modalHistorial').addEventListener('click', e => {
    if (e.target.id === 'modalHistorial') e.target.classList.add('oculto');
});

function exportarExcelSolicitudes() {
    generarExcel('Mis solicitudes - Grupo Calma', 'Mis_Solicitudes_GrupoCalma', [
        { hoja: 'Mis solicitudes', idTabla: 'tablaMisSolicitudes' }
    ]);
}

function exportarPDFSolicitudes() {
    generarPDF('Mis solicitudes', 'Mis_Solicitudes_GrupoCalma', {
        tablas: [{ idTabla: 'tablaMisSolicitudes' }]
    });
}