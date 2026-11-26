// Filtro por tipo y estado para las tablas (se usa en Mis solicitudes y Aprobaciones)
// Solo oculta filas; no vuelve a pedir datos al servidor

function aplicarFiltrosLista(idTbody, columnaTipo, columnaEstado) {
    const tipo = document.getElementById('filtroListaTipo')?.value || '';
    const estado = document.getElementById('filtroListaEstado')?.value || '';

    document.querySelectorAll(`#${idTbody} tr`).forEach(fila => {
        // filas de mensaje ("No hay solicitudes...") no se filtran
        if (fila.children.length <= 1) return;

        const textoTipo = columnaTipo === null ? '' : fila.children[columnaTipo].textContent.trim();
        const textoEstado = columnaEstado === null ? '' : fila.children[columnaEstado].textContent.trim();

        const mostrar = (!tipo || textoTipo.startsWith(tipo)) && (!estado || textoEstado === estado);
        fila.style.display = mostrar ? '' : 'none';
    });
}

function activarFiltrosLista(idTbody, columnaTipo, columnaEstado) {
    ['filtroListaTipo', 'filtroListaEstado'].forEach(id => {
        const select = document.getElementById(id);
        if (select) select.addEventListener('change', () => aplicarFiltrosLista(idTbody, columnaTipo, columnaEstado));
    });
}
