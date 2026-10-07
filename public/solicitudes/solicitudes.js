const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token) window.location.href = '/login/index.html';

document.getElementById('nombreUsuario').textContent = usuario.nombre || usuario.usuario || 'Usuario';

const modal = document.getElementById('modal');
const tipo = document.getElementById('tipo');
const form = document.getElementById('formSolicitud');
const mensaje = document.getElementById('mensaje');
const fechas = document.getElementById('camposFechas');
const fechaInicio = document.getElementById('fechaInicio');
const fechaFin = document.getElementById('fechaFin');
const motivo = document.getElementById('motivo');

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

    fechas.style.display = valor === '1' ? 'grid' : 'none';

    fechaInicio.required = valor === '1';
    fechaFin.required = valor === '1';

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

    mostrarMensaje('Creando solicitud...', '');

    const datos = {
        id_tipo_solicitud: Number(valor),
        fecha_inicio: fechaInicio.value || null,
        fecha_fin: fechaFin.value || null,
        motivo: motivo.value.trim() || null
    };

    try {
        const respuesta = await fetch('/api/solicitudes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(datos)
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

        if (!respuesta.ok) throw new Error();

        const solicitudes = await respuesta.json();

        document.getElementById('pendientes').textContent = solicitudes.filter(s => s.estado === 'Pendiente').length;
        document.getElementById('aprobadas').textContent = solicitudes.filter(s => s.estado === 'Aprobada').length;
        document.getElementById('rechazadas').textContent = solicitudes.filter(s => s.estado === 'Rechazada').length;

        const tabla = document.getElementById('tablaSolicitudes');

        if (!solicitudes.length) {
            tabla.innerHTML = '<tr><td colspan="7">No tienes solicitudes registradas.</td></tr>';
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
                    <td>${s.motivo || '-'}</td>
                    <td><span class="estado estado-${estado}">${s.estado}</span></td>
                </tr>`;
        }).join('');

    } catch (error) {
        document.getElementById('tablaSolicitudes').innerHTML = '<tr><td colspan="7">No se pudieron cargar las solicitudes.</td></tr>';
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-SV');
}

document.getElementById('cerrarSesion').addEventListener('click', () => {
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

actualizarFormulario();
cargarSolicitudes();