const bcrypt =require('bcryptjs');

const clave = process.argv[2];

if (!clave){
    console.log('Uso: node scripts/hashPassword.js <contraseña>');
    process.exit(1);
}

const hash = bcrypt.hashSync(clave, 10);
console.log(hash);
