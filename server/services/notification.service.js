const pool = require('../config/db');

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT UNSIGNED NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      titulo VARCHAR(150) NOT NULL,
      mensaje TEXT NOT NULL,
      intercambio_id INT UNSIGNED NULL,
      libro_id INT UNSIGNED NULL,
      leida BOOLEAN DEFAULT FALSE NOT NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notif_usuario (usuario_id),
      INDEX idx_notif_fecha (fecha_creacion),
      CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  tableReady = true;
}

async function createNotification({ userId, tipo, titulo, mensaje, exchangeId, bookId }) {
  await ensureTable();
  const [result] = await pool.execute(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, intercambio_id, libro_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, tipo, titulo, mensaje, exchangeId ?? null, bookId ?? null]
  );
  return result.insertId;
}

async function listForUser(userId, limit = 20) {
  await ensureTable();
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const [rows] = await pool.execute(
    `SELECT id, tipo, titulo, mensaje, intercambio_id, libro_id, leida, fecha_creacion
     FROM notificaciones
     WHERE usuario_id = ?
     ORDER BY fecha_creacion DESC
     LIMIT ${safeLimit}`,
    [userId]
  );
  return rows;
}

module.exports = {
  ensureTable,
  createNotification,
  listForUser
};
