require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { attachShelfSocket } = require('./services/shelf-socket');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas adaptadas a los nombres de tus archivos
app.use('/api/users', require('./routes/usuarioRoutes'));
app.use('/api/books', require('./routes/book.routes'));
app.use('/api/exchanges', require('./routes/exchange.routes'));
app.use('/api/shelf', require('./routes/shelf.routes'));
app.use('/api', require('./routes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Páramo Libre funcionando correctamente' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 3001;
const pool = require('./config/db');

Promise.all([
  pool.query(`
    CREATE TABLE IF NOT EXISTS fotos_perfil (
      usuario_id INT UNSIGNED PRIMARY KEY,
      mime VARCHAR(40) NOT NULL,
      datos MEDIUMBLOB NOT NULL,
      actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_foto_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `),
  pool.query(`
    CREATE TABLE IF NOT EXISTS fotos_libros (
      libro_id INT UNSIGNED PRIMARY KEY,
      mime VARCHAR(40) NOT NULL,
      datos MEDIUMBLOB NOT NULL,
      actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_foto_libro FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `),
  pool.query(`
    CREATE TABLE IF NOT EXISTS tarjetas_rfid (
      uid VARCHAR(32) PRIMARY KEY,
      libro_id INT UNSIGNED NOT NULL,
      actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_rfid_libro FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
]).then(async () => {
  try {
    const adminEmail = 'sayleonnieto8@gmail.com';
    const adminPasswordHash = '$2b$10$QljrroOn5T/MUnc50Hds6.2Tpb4/camAsf0PrSWU2D7NHu49ejwN.';
    await pool.execute(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, activo, email_verificado)
       VALUES ('Sayle Nieto', ?, ?, 'admin', TRUE, TRUE)
       ON DUPLICATE KEY UPDATE rol = 'admin', password_hash = VALUES(password_hash), activo = TRUE`,
      [adminEmail, adminPasswordHash]
    );
    await pool.execute(
      `UPDATE usuarios SET rol = 'usuario' WHERE rol = 'admin' AND LOWER(email) <> ?`,
      [adminEmail]
    );
  } catch (error) {
    console.error('No se pudo asignar el administrador:', error.message);
  }
  const server = http.createServer(app);
  attachShelfSocket(server);
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch((error) => {
  const detalles = [error.code, error.message].filter(Boolean).join(' ');
  console.error('No se pudo preparar la base de datos:', detalles || error);
  if (Array.isArray(error.errors)) {
    error.errors.forEach((item) => console.error('  -', item.code || '', item.message || item));
  }
  process.exit(1);
});
