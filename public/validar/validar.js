// Pagina publica: comprueba si una constancia es real (no necesita iniciar sesion)
const form = document.getElementById('formValidar');
const campoCodigo = document.getElementById('codigo');
const resultado = document.getElementById('resultado');

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function validar(codigo) {
    resultado.innerHTML = '<p class="subtitulo">Validando...</p>';

    try {
        const respuesta = await fetch(`/api/constancias/validar/${encodeURIComponent(codigo)}`);
        const datos = await respuesta.json();

        if (!datos.valida) {
            resultado.innerHTML = `
                <div class="tarjeta no-valida">
                    <h2>❌ Constancia no válida</h2>
                    <p>${escaparHTML(datos.error || 'No se encontró la constancia.')}</p>
                </div>`;
            return;
        }

        resultado.innerHTML = `
            <div class="tarjeta valida">
                <h2>✅ Constancia válida</h2>
                <dl>
                    <dt>Código</dt><dd>${escaparHTML(datos.codigo)}</dd>
                    <dt>Tipo</dt><dd>Constancia ${escaparHTML(datos.tipo)}</dd>
                    <dt>Empleado</dt><dd>${escaparHTML(datos.nombre)}</dd>
                    <dt>Cargo</dt><dd>${escaparHTML(datos.cargo)}</dd>
                    <dt>Salario mensual</dt><dd>${datos.salario.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</dd>
                    <dt>Emitida el</dt><dd>${formatearFecha(datos.fecha_emision)}</dd>
                </dl>
                ${datos.empleado_activo ? '' : '<p class="aviso">El empleado ya no labora actualmente en la empresa.</p>'}
            </div>`;
    } catch (error) {
        resultado.innerHTML = '<div class="tarjeta no-valida"><h2>No se pudo validar</h2><p>Intenta de nuevo más tarde.</p></div>';
    }
}

form.addEventListener('submit', e => {
    e.preventDefault();
    const codigo = campoCodigo.value.trim().toUpperCase();
    if (codigo) validar(codigo);
});

// si viene del QR, el codigo llega en la URL
const codigoUrl = new URLSearchParams(window.location.search).get('codigo');
if (codigoUrl) {
    campoCodigo.value = codigoUrl.toUpperCase();
    validar(codigoUrl);
}
