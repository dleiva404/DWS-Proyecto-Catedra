const mysql = require('mysql2');
require('dotenv').config();

// pool: si una conexion se cae, abre otra sola
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// prueba de conexion al iniciar
db.getConnection((error, conexion) => {
    if (error) {
        console.log('error conectando a la base de datos:', error);
        return;
    }
    console.log('conectado a mysql exitosamente');
    conexion.release();
});

module.exports = db;