const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307'), // <-- AQUÍ ESTÁ EL CAMBIO
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '201210080Sln',
  database: process.env.DB_NAME || 'paramo_libre',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(connection => {
    console.log('✅ Conexión a MySQL establecida correctamente en el puerto 3307.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar con MySQL:', err.message);
  });

module.exports = pool;