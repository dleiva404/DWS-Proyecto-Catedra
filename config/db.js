const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((error) => {
    if (error) {
        console.log('error conectando a la base de datos:', error);
        return;
    }
    console.log('conectado a mysql exitosamente');
});

module.exports = db;