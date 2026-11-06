// Funciones para exportar tablas a Excel y PDF (las usan Mis Solicitudes y Reportes)

// Lee una tabla de la pantalla sin la columna de botones "Detalle"
function leerTablaExportar(idTabla) {
    const tabla = document.getElementById(idTabla);
    const encabezados = Array.from(tabla.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const indiceDetalle = encabezados.indexOf('Detalle');

    const filas = Array.from(tabla.querySelectorAll('tbody tr'))
        .filter(tr => tr.children.length > 1)
        .map(tr => Array.from(tr.children).map(td => td.querySelector('button') ? 'Sí' : td.textContent.trim()));

    if (indiceDetalle >= 0) {
        encabezados.splice(indiceDetalle, 1);
        filas.forEach(fila => fila.splice(indiceDetalle, 1));
    }

    return { encabezados, filas };
}

function fechaHoy() {
    return new Date().toLocaleString('es-SV');
}

// Convierte "16/10/2026" en el numero de fecha que usa Excel
function convertirFecha(texto) {
    const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);
    if (!partes) return null;
    return (Date.UTC(partes[3], partes[2] - 1, partes[1]) - Date.UTC(1899, 11, 30)) / 86400000;
}

// Crea una hoja con titulo, encabezados azules y estados en color
function crearHojaExcel(titulo, encabezados, filas) {
    const columnas = encabezados.length;
    const columnasCentradas = ['ID', 'Tipo', 'Fecha solicitud', 'Inicio', 'Fin', 'Estado', 'Adjunto', 'Asignados', 'Utilizados', 'Disponibles'];

    // numeros y fechas con su tipo correcto
    const esFecha = filas.map(fila => fila.map(valor => convertirFecha(valor) !== null));

    const datos = filas.map(fila => fila.map(valor => {
        const fecha = convertirFecha(valor);
        if (fecha !== null) return fecha;
        if (/^\d+$/.test(valor)) return Number(valor);
        return valor;
    }));

    const hoja = XLSX.utils.aoa_to_sheet([
        [titulo],
        ['Generado: ' + fechaHoy()],
        [],
        encabezados,
        ...datos
    ]);

    hoja['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columnas - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: columnas - 1 } }
    ];

    hoja['!cols'] = encabezados.map((encabezado, i) => {
        const largo = Math.max(encabezado.length, ...filas.map(f => String(f[i] || '').length));
        return { wch: Math.max(largo + 4, 10) };
    });

    hoja['!rows'] = [{ hpt: 30 }, { hpt: 18 }, { hpt: 8 }, { hpt: 22 }];

    hoja['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 3, c: 0 }, e: { r: 3 + filas.length, c: columnas - 1 } }) };

    const borde = { style: 'thin', color: { rgb: 'CBD5E1' } };
    const bordes = { top: borde, bottom: borde, left: borde, right: borde };
    const estados = {
        Aprobada: { texto: '047857', fondo: 'D1FAE5' },
        Rechazada: { texto: 'B91C1C', fondo: 'FEE2E2' },
        Pendiente: { texto: 'B45309', fondo: 'FEF3C7' }
    };

    // titulo como banda azul
    for (let c = 0; c < columnas; c++) {
        const celda = XLSX.utils.encode_cell({ r: 0, c });
        hoja[celda] = hoja[celda] || { t: 's', v: '' };
        hoja[celda].s = {
            font: { bold: true, sz: 15, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1E3A8A' } },
            alignment: { vertical: 'center', horizontal: 'left', indent: 1 }
        };
    }
    hoja['A2'].s = { font: { italic: true, sz: 9, color: { rgb: '64748B' } } };

    for (let c = 0; c < columnas; c++) {
        const centrada = columnasCentradas.includes(encabezados[c]);

        hoja[XLSX.utils.encode_cell({ r: 3, c })].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2563EB' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: bordes
        };

        datos.forEach((fila, f) => {
            const celda = hoja[XLSX.utils.encode_cell({ r: 4 + f, c })];
            if (!celda) return;

            celda.s = {
                border: bordes,
                alignment: { horizontal: centrada ? 'center' : 'left', vertical: 'center' },
                fill: f % 2 ? { fgColor: { rgb: 'F8FAFC' } } : undefined
            };

            if (esFecha[f][c]) celda.z = 'dd/mm/yyyy';

            // estado con fondo de color
            const estado = estados[celda.v];
            if (estado) {
                celda.s.font = { bold: true, color: { rgb: estado.texto } };
                celda.s.fill = { fgColor: { rgb: estado.fondo } };
            }
        });
    }

    return hoja;
}

// Hoja con los totales del reporte
function crearHojaResumen(titulo, resumen) {
    const hoja = XLSX.utils.aoa_to_sheet([
        [titulo],
        ['Generado: ' + fechaHoy()],
        [],
        ['Indicador', 'Total'],
        ...resumen.map(dato => [dato.texto, Number(dato.valor)])
    ]);

    hoja['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }];
    hoja['!cols'] = [{ wch: 28 }, { wch: 12 }];
    hoja['!rows'] = [{ hpt: 30 }, { hpt: 18 }, { hpt: 8 }, { hpt: 22 }];

    const borde = { style: 'thin', color: { rgb: 'CBD5E1' } };
    const bordes = { top: borde, bottom: borde, left: borde, right: borde };

    ['A1', 'B1'].forEach(celda => {
        hoja[celda] = hoja[celda] || { t: 's', v: '' };
        hoja[celda].s = { font: { bold: true, sz: 15, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A8A' } }, alignment: { vertical: 'center', indent: 1 } };
    });
    hoja['A2'].s = { font: { italic: true, sz: 9, color: { rgb: '64748B' } } };

    ['A4', 'B4'].forEach(celda => {
        hoja[celda].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } }, alignment: { horizontal: 'center' }, border: bordes };
    });

    resumen.forEach((dato, i) => {
        const color = dato.color.map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
        hoja['A' + (5 + i)].s = { font: { bold: true }, border: bordes };
        hoja['B' + (5 + i)].s = { font: { bold: true, sz: 12, color: { rgb: color } }, alignment: { horizontal: 'center' }, border: bordes };
    });

    return hoja;
}

// tablas: [{ hoja, idTabla }]  resumen (opcional): [{ texto, valor, color }]
function generarExcel(titulo, nombreArchivo, tablas, resumen) {
    const libro = XLSX.utils.book_new();

    if (resumen) XLSX.utils.book_append_sheet(libro, crearHojaResumen(titulo, resumen), 'Resumen');

    tablas.forEach(t => {
        const { encabezados, filas } = leerTablaExportar(t.idTabla);
        XLSX.utils.book_append_sheet(libro, crearHojaExcel(titulo + ' - ' + t.hoja, encabezados, filas), t.hoja);
    });

    XLSX.writeFile(libro, nombreArchivo + '.xlsx', { cellStyles: true });
}

function cargarLogo() {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = '/assets/logo.png';
    });
}

// opciones: { resumen, graficos: [idCanvas], tablas: [{ titulo, idTabla }] }
async function generarPDF(titulo, nombreArchivo, opciones) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const ancho = doc.internal.pageSize.getWidth();
    const azul = [37, 99, 235];

    // encabezado con logo
    const logo = await cargarLogo();
    if (logo) doc.addImage(logo, 'PNG', 14, 10, 40, 13, undefined, 'FAST');

    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(titulo, ancho - 14, 17, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Generado: ' + fechaHoy(), ancho - 14, 23, { align: 'right' });

    doc.setDrawColor(...azul);
    doc.setLineWidth(0.8);
    doc.line(14, 28, ancho - 14, 28);

    let y = 36;

    // totales
    if (opciones.resumen) {
        const anchoCaja = (ancho - 28 - 9) / opciones.resumen.length;

        opciones.resumen.forEach((dato, i) => {
            const x = 14 + i * (anchoCaja + 3);
            doc.setFillColor(...dato.color);
            doc.roundedRect(x, y, anchoCaja, 18, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.text(String(dato.valor), x + anchoCaja / 2, y + 9, { align: 'center' });
            doc.setFontSize(7);
            doc.text(dato.texto.toUpperCase(), x + anchoCaja / 2, y + 14.5, { align: 'center' });
        });

        y += 26;
    }

    // graficos como imagen
    if (opciones.graficos) {
        const anchoGrafico = (ancho - 28 - 6) / 2;

        let altoMayor = 0;

        opciones.graficos.forEach((idCanvas, i) => {
            const canvas = document.getElementById(idCanvas);
            const alto = anchoGrafico * canvas.height / canvas.width;
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 14 + i * (anchoGrafico + 6), y, anchoGrafico, alto, undefined, 'FAST');
            if (alto > altoMayor) altoMayor = alto;
        });

        y += altoMayor + 12;
    }

    // tablas
    opciones.tablas.forEach(t => {
        const { encabezados, filas } = leerTablaExportar(t.idTabla);

        if (t.titulo) {
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.text(t.titulo, 14, y);
            y += 3;
        }

        const columnaEstado = encabezados.indexOf('Estado');

        doc.autoTable({
            head: [encabezados],
            body: filas,
            startY: y,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2.5, lineColor: [226, 232, 240], textColor: [30, 41, 59] },
            headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            // color segun el estado
            didParseCell: data => {
                if (data.section !== 'body' || data.column.index !== columnaEstado) return;
                const colores = { Aprobada: [5, 150, 105], Rechazada: [220, 38, 38], Pendiente: [217, 119, 6] };
                const color = colores[data.cell.raw];
                if (color) {
                    data.cell.styles.textColor = color;
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        y = doc.lastAutoTable.finalY + 12;
    });

    // numero de pagina
    const paginas = doc.getNumberOfPages();
    for (let i = 1; i <= paginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Grupo Calma - Sistema de RRHH', 14, doc.internal.pageSize.getHeight() - 8);
        doc.text('Página ' + i + ' de ' + paginas, ancho - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save(nombreArchivo + '.pdf');
}