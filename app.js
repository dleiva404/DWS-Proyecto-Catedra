const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

// 1. Importar las rutas de empleados
const empleadoRoutes = require('./routes/empleadoRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('api funcionando');
});

// 2. Activar las rutas de empleados bajo el prefijo /api/empleados
app.use('/api/empleados', empleadoRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`servidor en puerto ${PORT}`);
});