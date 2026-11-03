
const token = localStorage.getItem('token');
let usuarioSesion = {};

try {
    usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');
} catch (error) {
    usuarioSesion = {};
}

const ROL_ADMIN = 'Administrador de TI';

let usuarios = [];
let roles = [];
let modoEdicion = false;

const elementos = {
    nombreUsuario: document.getElementById('nombreUsuario'),
    cerrarSesion: document.getElementById('cerrarSesion'),
    btnNuevoUsuario: document.getElementById('btnNuevoUsuario'),
    buscarUsuario: document.getElementById('buscarUsuario'),
    totalUsuarios: document.getElementById('totalUsuarios'),
    tablaUsuarios: document.getElementById('tablaUsuarios'),
    mensaje: document.getElementById('mensaje'),
    modal: document.getElementById('modalUsuario'),
    tituloModal: document.getElementById('tituloModal'),
    form: document.getElementById('formUsuario'),
    idUsuario: document.getElementById('idUsuario'),
    usuario: document.getElementById('usuario'),
    contrasena: document.getElementById('contrasena'),
    indicadorContrasena: document.getElementById('indicadorContrasena'),
    ayudaContrasena: document.getElementById('ayudaContrasena'),
    idRol: document.getElementById('idRol'),
    mensajeFormulario: document.getElementById('mensajeFormulario'),
    btnGuardar: document.getElementById('btnGuardar'),
    btnCancelar: document.getElementById('btnCancelar'),
    btnCerrarModal: document.getElementById('btnCerrarModal')
};

// Validar sesión y rol antes de cargar información
if (!token) {
    window.location.replace('/login/index.html');
} else if (usuarioSesion.rol !== ROL_ADMIN) {
    document.body.innerHTML = `
        <main style="font-family:Arial,sans-serif;text-align:center;padding:60px 20px">
            <h1>Acceso restringido</h1>
            <p>Solo el Administrador de TI puede gestionar usuarios.</p>
            <a href="/dashboard/dashboard.html">Volver al dashboard</a>
        </main>
    `;
} else {
    iniciarModulo();
}

function iniciarModulo() {
    elementos.nombreUsuario.textContent =
        usuarioSesion.nombre || usuarioSesion.usuario || 'Administrador';

    elementos.btnNuevoUsuario.addEventListener('click', abrirCrear);
    elementos.btnCancelar.addEventListener('click', cerrarModal);
    elementos.btnCerrarModal.addEventListener('click', cerrarModal);

    elementos.buscarUsuario.addEventListener('input', renderizarUsuarios);
    elementos.form.addEventListener('submit', guardarUsuario);

    elementos.cerrarSesion.addEventListener('click', cerrarSesion);

    elementos.modal.addEventListener('click', event => {
        if (event.target === elementos.modal) {
            cerrarModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !elementos.modal.hidden) {
            cerrarModal();
        }
    });

    cargarDatos();
}

// Peticiones a la API
async function peticionAPI(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
            ...opciones.headers
        }
    });

    if (respuesta.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.replace('/login/index.html');
        throw new Error('La sesión expiró. Inicia sesión nuevamente.');
    }

    if (respuesta.status === 403) {
        throw new Error('No tienes permisos para realizar esta acción.');
    }

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(datos.error || datos.mensaje || 'Ocurrió un error en la solicitud.');
    }

    return datos;
}

// Cargar usuarios y roles
async function cargarDatos() {
    elementos.tablaUsuarios.innerHTML = `
        <tr><td colspan="4" class="texto-vacio">Cargando usuarios...</td></tr>
    `;

    try {
        const [datosUsuarios, datosRoles] = await Promise.all([
            peticionAPI('/api/usuarios'),
            peticionAPI('/api/roles')
        ]);

        usuarios = Array.isArray(datosUsuarios) ? datosUsuarios : [];
        roles = Array.isArray(datosRoles) ? datosRoles : [];

        cargarOpcionesRoles();
        renderizarUsuarios();

    } catch (error) {
        mostrarMensaje(error.message, 'error');

        elementos.tablaUsuarios.innerHTML = `
            <tr><td colspan="4" class="texto-vacio">
                No se pudieron cargar los usuarios. Comprueba la conexión y los permisos.
            </td></tr>
        `;
    }
}

function cargarOpcionesRoles() {
    elementos.idRol.innerHTML = '<option value="">Selecciona un rol</option>';

    roles.forEach(rol => {
        const opcion = document.createElement('option');
        opcion.value = rol.id_rol;
        opcion.textContent = rol.nombre;
        elementos.idRol.appendChild(opcion);
    });
}

// Mostrar y buscar usuarios
function renderizarUsuarios() {
    const busqueda = elementos.buscarUsuario.value.trim().toLowerCase();

    const filtrados = usuarios.filter(usuario =>
        String(usuario.usuario || '').toLowerCase().includes(busqueda)
    );

    elementos.totalUsuarios.textContent = filtrados.length;

    if (!filtrados.length) {
        elementos.tablaUsuarios.innerHTML = `
            <tr><td colspan="4" class="texto-vacio">
                No se encontraron usuarios.
            </td></tr>
        `;
        return;
    }

    elementos.tablaUsuarios.replaceChildren();

    filtrados.forEach(usuario => {
        const rol = roles.find(r =>
            Number(r.id_rol) === Number(usuario.id_rol)
        );

        const activo = esActivo(usuario.estado);
        const fila = document.createElement('tr');

        const celdaUsuario = document.createElement('td');
        celdaUsuario.textContent = usuario.usuario || '';

        const celdaRol = document.createElement('td');
        celdaRol.textContent = rol ? rol.nombre : 'Rol no identificado';

        const celdaEstado = document.createElement('td');
        const etiqueta = document.createElement('span');
        etiqueta.className = `estado ${activo ? 'activo' : 'inactivo'}`;
        etiqueta.textContent = activo ? 'Activo' : 'Inactivo';
        celdaEstado.appendChild(etiqueta);

        const celdaAcciones = document.createElement('td');
        const acciones = document.createElement('div');
        acciones.className = 'acciones';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.className = 'btn-tabla btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => abrirEditar(usuario));

        const btnEstado = document.createElement('button');
        btnEstado.type = 'button';
        btnEstado.className = `btn-tabla ${activo ? 'btn-desactivar' : 'btn-activar'}`;
        btnEstado.textContent = activo ? 'Desactivar' : 'Activar';
        btnEstado.addEventListener('click', () => cambiarEstado(usuario));

        acciones.append(btnEditar, btnEstado);
        celdaAcciones.appendChild(acciones);

        fila.append(celdaUsuario, celdaRol, celdaEstado, celdaAcciones);
        elementos.tablaUsuarios.appendChild(fila);
    });
}

function esActivo(estado) {
    return estado === true || estado === 1 || estado === '1';
}

// Abrir formulario para crear
function abrirCrear() {
    modoEdicion = false;
    elementos.form.reset();
    elementos.idUsuario.value = '';

    elementos.tituloModal.textContent = 'Nuevo usuario';
    elementos.btnGuardar.textContent = 'Guardar usuario';
    elementos.indicadorContrasena.textContent = '*';
    elementos.contrasena.required = true;
    elementos.ayudaContrasena.textContent = 'Obligatoria para crear un usuario.';

    limpiarMensajeFormulario();
    elementos.modal.hidden = false;
    elementos.usuario.focus();
}

// Abrir formulario para editar
function abrirEditar(usuario) {
    modoEdicion = true;
    elementos.form.reset();

    elementos.idUsuario.value = usuario.id_usuario;
    elementos.usuario.value = usuario.usuario || '';
    elementos.idRol.value = String(usuario.id_rol);

    elementos.tituloModal.textContent = 'Editar usuario';
    elementos.btnGuardar.textContent = 'Guardar cambios';
    elementos.indicadorContrasena.textContent = '(opcional)';
    elementos.contrasena.required = false;
    elementos.ayudaContrasena.textContent =
        'Déjala vacía si no deseas cambiar la contraseña.';

    limpiarMensajeFormulario();
    elementos.modal.hidden = false;
    elementos.usuario.focus();
}

function cerrarModal() {
    elementos.modal.hidden = true;
    elementos.form.reset();
    limpiarMensajeFormulario();
}

function limpiarMensajeFormulario() {
    elementos.mensajeFormulario.textContent = '';
    elementos.mensajeFormulario.className = 'mensaje';
}

function mostrarMensaje(mensaje, tipo) {
    elementos.mensaje.textContent = mensaje;
    elementos.mensaje.className = `mensaje ${tipo}`;
}

function mostrarMensajeFormulario(mensaje, tipo) {
    elementos.mensajeFormulario.textContent = mensaje;
    elementos.mensajeFormulario.className = `mensaje ${tipo}`;
}

// Crear o actualizar usuario
async function guardarUsuario(event) {
    event.preventDefault();
    limpiarMensajeFormulario();

    const id = elementos.idUsuario.value;
    const nombreUsuario = elementos.usuario.value.trim();
    const contrasena = elementos.contrasena.value;
    const idRol = elementos.idRol.value;

    if (!nombreUsuario || !idRol || (!modoEdicion && !contrasena)) {
        mostrarMensajeFormulario(
            'Completa los campos obligatorios.',
            'error'
        );
        return;
    }

    const existente = usuarios.find(u =>
        String(u.usuario || '').toLowerCase() === nombreUsuario.toLowerCase() &&
        String(u.id_usuario) !== String(id)
    );

    if (existente) {
        mostrarMensajeFormulario(
            'Ese nombre de usuario ya aparece registrado.',
            'error'
        );
        return;
    }

    const usuarioActual = usuarios.find(u =>
        String(u.id_usuario) === String(id)
    );

    const datos = {
        usuario: nombreUsuario,
        id_rol: Number(idRol)
    };

    if (contrasena) {
        datos.contrasena = contrasena;
    }

    // El backend actual espera estado al actualizar.
    // Enviarlo evita reactivar accidentalmente cuentas inactivas.
    if (modoEdicion && usuarioActual) {
        datos.estado = esActivo(usuarioActual.estado);
    } else {
        datos.estado = true;
    }

    const url = modoEdicion
        ? `/api/usuarios/${encodeURIComponent(id)}`
        : '/api/usuarios';

    const metodo = modoEdicion ? 'PUT' : 'POST';

    elementos.btnGuardar.disabled = true;
    elementos.btnGuardar.textContent = 'Guardando...';

    try {
        const resultado = await peticionAPI(url, {
            method: metodo,
            body: JSON.stringify(datos)
        });

        cerrarModal();
        mostrarMensaje(
            resultado.mensaje ||
            (modoEdicion
                ? 'Usuario actualizado exitosamente.'
                : 'Usuario creado exitosamente.'),
            'exito'
        );

        await cargarDatos();

    } catch (error) {
        mostrarMensajeFormulario(error.message, 'error');
    } finally {
        elementos.btnGuardar.disabled = false;
        elementos.btnGuardar.textContent = modoEdicion
            ? 'Guardar cambios'
            : 'Guardar usuario';
    }
}

// Desactivar o reactivar sin borrar el registro
async function cambiarEstado(usuario) {
    const activo = esActivo(usuario.estado);
    const nuevoEstado = !activo;

    if (
        String(usuario.usuario).toLowerCase() ===
        String(usuarioSesion.usuario || '').toLowerCase() &&
        nuevoEstado === false
    ) {
        mostrarMensaje(
            'No puedes desactivar tu propia cuenta desde esta pantalla.',
            'error'
        );
        return;
    }

    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (!confirm(`¿Deseas ${accion} la cuenta "${usuario.usuario}"?`)) {
        return;
    }

    try {
        let resultado;

        if (nuevoEstado) {
            // PUT actualiza el estado a activo sin eliminar el registro.
            resultado = await peticionAPI(
                `/api/usuarios/${encodeURIComponent(usuario.id_usuario)}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        usuario: usuario.usuario,
                        id_rol: usuario.id_rol,
                        estado: true
                    })
                }
            );
        } else {
            // DELETE en esta API realiza una desactivación lógica.
            resultado = await peticionAPI(
                `/api/usuarios/${encodeURIComponent(usuario.id_usuario)}`,
                { method: 'DELETE' }
            );
        }

        mostrarMensaje(
            resultado.mensaje ||
            `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`,
            'exito'
        );

        await cargarDatos();

    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

// Cerrar sesión
async function cerrarSesion() {
    elementos.cerrarSesion.disabled = true;

    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        // Se limpia la sesión local aunque falle la petición.
    }

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.replace('/login/index.html');
}
