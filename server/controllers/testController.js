const db = require('../config/db');

// Ruta de prueba general de la API
exports.getTest = (req, res) => {
  res.json({
    success: true,
    message: 'API de Páramo Libre funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};

// Ruta de prueba de conexión a MySQL
exports.testDatabase = async (req, res) => {
  try {
    // Consulta simple para verificar que MySQL responde
    const [rows] = await db.query(`
      SELECT 
        1 + 1 AS resultado, 
        NOW() AS fecha_servidor, 
        DATABASE() AS base_datos_actual,
        VERSION() AS version_mysql
    `);

    res.json({
      success: true,
      message: 'Conexión a MySQL establecida correctamente',
      data: rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Error en testDatabase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al conectar con la base de datos MySQL',
      error: error.message,
      hint: 'Verifica que MySQL esté corriendo y que la base de datos "paramo_libre" exista.'
    });
  }
};