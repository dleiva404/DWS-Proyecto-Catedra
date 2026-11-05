const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token) window.location.href = '/login/index.html';

const ROLES_APROBADORES = ['Jefe inmediato', 'Analista de Nómina', 'Gerente'];

if (!ROLES_APROBADORES.includes(usuario.rol)) {
    window.location.href = '/dashboard/dashboard.html';
}

document.getElementById('nombreUsuario').textContent = usuario.nombre || usuario.usuario || 'Usuario';
document.getElementById('descripcionRol').textContent = `Solicitudes que requieren tu revisión como ${usuario.rol}.`;

const tabla = document.getElementById('tablaPendientes');
const mensajeGeneral = document.getElementById('mensajeGeneral');
const modal = document.getElementById('modalRechazo');
const formRechazo = document.getElementById('formRechazo');
const comentario = document.getElementById('comentario');
const mensajeModal = document.getElementById('mensajeModal');

let etapaARechazar = null;

async function cargarPendientes() {
    try {
        const respuesta = await fetch('/api/solicitudes/pendientes', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) return salirSinSesion();
        if (!respuesta.ok) throw new Error();

        const pendientes = await respuesta.json();

        if (!pendientes.length) {
            tabla.innerHTML = '<tr><td colspan="9">No tienes solicitudes pendientes de revisar.</td></tr>';
            return;
        }

        tabla.innerHTML = pendientes.map(p => `
            <tr>
                <td>${p.id_solicitud}</td>
                <td>${escaparHTML(p.nombre + ' ' + p.apellido)}</td>
                <td>${escaparHTML(p.tipo)}</td>
                <td>${escaparHTML(p.nombre_etapa)}</td>
                <td>${formatearFecha(p.fecha_inicio)}</td>
                <td>${formatearFecha(p.fecha_fin)}</td>
                <td>${p.motivo ? escaparHTML(p.motivo) : '-'}</td>
                <td>${p.archivo_adjunto? '<button class="btn-adjunto" data-id="' + p.id_solicitud + '">Ver archivo</button>': '-'}</td><td>
                    <div class="acciones">
                        <button class="btn-adjunto btn-historial" data-id="${p.id_solicitud}">Historial</button>
                        <button class="btn-aprobar" data-etapa="${p.id_etapa_solicitud}">Aprobar</button>
                        <button class="btn-rechazar" data-etapa="${p.id_etapa_solicitud}">Rechazar</button>
                    </div>
                </td>
            </tr>`).join('');

    } catch (error) {
        tabla.innerHTML = '<tr><td colspan="9">No se pudieron cargar las solicitudes pendientes.</td></tr>';
    }
}

tabla.addEventListener('click', e => {

    const botonHistorial = e.target.closest('.btn-historial');

    if (botonHistorial) {
        verHistorial(botonHistorial.dataset.id);
        return;
    }

    const botonAdjunto = e.target.closest('.btn-adjunto');

    if (botonAdjunto) {
        abrirAdjunto(botonAdjunto.dataset.id);
        return;
    }

    const id = e.target.dataset.etapa;
    if (!id) return;

    if (e.target.classList.contains('btn-aprobar')) {
        e.target.disabled = true;
        resolver(id, 'Aprobada');
    }

    if (e.target.classList.contains('btn-rechazar')) {
        etapaARechazar = id;
        comentario.value = '';
        mensajeModal.textContent = '';
        modal.classList.remove('oculto');
    }
});

formRechazo.addEventListener('submit', async e => {
    e.preventDefault();

    if (!comentario.value.trim()) {
        mensajeModal.textContent = 'El motivo del rechazo es obligatorio.';
        mensajeModal.className = 'mensaje error';
        return;
    }

    const ok = await resolver(etapaARechazar, 'Rechazada', comentario.value.trim());
    if (ok) cerrarModal();
});

async function resolver(idEtapa, decision, motivoRechazo) {
    try {
        const respuesta = await fetch(`/api/solicitudes/etapa/${idEtapa}/resolver`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ decision, comentario: motivoRechazo || null })
        });

        if (respuesta.status === 401) return salirSinSesion();

        const resultado = await respuesta.json();

        if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo resolver la solicitud');

        mostrarMensaje(resultado.mensaje, 'exito');
        cargarPendientes();
        return true;

    } catch (error) {
        mostrarMensaje(error.message, 'error');
        cargarPendientes();
        return false;
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

function mostrarMensaje(texto, tipo) {
    mensajeGeneral.textContent = texto;
    mensajeGeneral.className = `mensaje ${tipo}`;
}

function cerrarModal() {
    modal.classList.add('oculto');
    etapaARechazar = null;
}

document.getElementById('cerrarModal').addEventListener('click', cerrarModal);

modal.addEventListener('click', e => {
    if (e.target === modal) cerrarModal();
});

function salirSinSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login/index.html';
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-SV');
}

function escaparHTML(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.getElementById('cerrarSesion').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (e) {
    }

    salirSinSesion();
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

cargarPendientes();