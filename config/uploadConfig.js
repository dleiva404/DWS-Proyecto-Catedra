
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');

// Carpeta donde se guardarán los archivos adjuntos
const carpetaDestino = path.join(__dirname, '..', 'uploads', 'solicitudes');

// Configuración del almacenamiento
const storage = multer.diskStorage({

    // Define dónde se guardará el archivo
    destination: (req, file, cb) => {
        cb(null, carpetaDestino);
    },

    // Genera un nombre único para evitar sobrescribir archivos
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const nombreUnico = `solicitud_${Date.now()}_${Math.round(Math.random() * 1E9)}${extension}`;

        cb(null, nombreUnico);
    }
});

// Tipos de archivos permitidos
const fileFilter = (req, file, cb) => {
    const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];

    const extension = path.extname(file.originalname).toLowerCase();

    const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/png'
    ];

    if (
        extensionesPermitidas.includes(extension) &&
        tiposPermitidos.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF, JPG y PNG.'));
    }
};

// Valida que el contenido real coincida con el formato permitido
const validarContenidoArchivo = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        // Carga file-type usando import dinámico
        const { fileTypeFromFile } = await import('file-type');

        // Identifica el formato real del archivo
        const tipoReal = await fileTypeFromFile(req.file.path);

        const extensionesPorMime = {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        };

        // Obtiene la extensión original del archivo
        const extensionArchivo = path.extname(req.file.originalname).toLowerCase();

        // Obtiene las extensiones válidas para el contenido detectado
        const extensionesValidas = tipoReal
            ? extensionesPorMime[tipoReal.mime]
            : null;

        // Rechaza archivos cuyo contenido o extensión no coincidan
        if (
            !tipoReal ||
            !extensionesValidas ||
            !extensionesValidas.includes(extensionArchivo)
        ) {
            await fs.unlink(req.file.path);

            return res.status(400).json({
                error: 'La extensión o el contenido del archivo no corresponden a un PDF, JPG o PNG válido.'
            });
        }

        next();

    } catch (error) {
        console.error('Error al validar el archivo:', error);

        await fs.unlink(req.file.path).catch(() => { });

        return res.status(500).json({
            error: 'No se pudo validar el archivo.'
        });
    }
};

// Configuración principal de Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Máximo 5 MB
    }
});

// Exporta Multer y el middleware de validación
module.exports = {
    upload,
    validarContenidoArchivo
};
