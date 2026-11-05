
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const empleadoRoutes = require('./routes/empleadoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const rolRoutes = require('./routes/rolRoutes');
const tipoSolicitudRoutes = require('./routes/tipoSolicitudRoutes');
const authRoutes = require('./routes/authRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => { req.body = req.body || {}; next(); });
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/login/index.html');
});

app.use('/api/empleados', empleadoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/tipos-solicitud', tipoSolicitudRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/reportes', reporteRoutes);

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'El cuerpo de la petición no es un JSON válido'
        });
    }

    // Verifica si el archivo supera los 5 MB
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            error: 'El archivo no puede superar los 5 MB.'
        });
    }

    // Verifica si el formato del archivo no está permitido
    if (err.message === 'Solo se permiten archivos PDF, JPG y PNG.') {
        return res.status(400).json({
            error: err.message
        });
    }

    console.error('Error no controlado:', err);
    res.status(err.status || 500).json({
        error: 'Error interno del servidor'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`servidor en puerto ${PORT}`);
});
