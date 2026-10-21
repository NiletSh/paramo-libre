const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'paramo_libre_secret_key';

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso no autorizado. Token no proporcionado.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // Mantener compatibilidad con controladores nuevos y antiguos.
    req.usuario = decoded;
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Token inválido o expirado.'
    });
  }
};

const authorize = (roles = []) => {
  return async (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso no autorizado.'
      });
    }

    if (roles.length && !roles.includes(req.usuario.rol)) {
      try {
        const pool = require('../config/db');
        const [rows] = await pool.query(
          'SELECT rol FROM usuarios WHERE id = ? AND activo = TRUE LIMIT 1',
          [req.usuario.id]
        );
        if (rows[0]?.rol) {
          req.usuario.rol = rows[0].rol;
          if (req.user) req.user.rol = rows[0].rol;
        }
      } catch (error) {
        console.error('No se pudo confirmar el rol:', error.message);
      }
    }

    if (roles.length && !roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para realizar esta acción.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
