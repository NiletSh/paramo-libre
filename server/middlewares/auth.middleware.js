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
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso no autorizado.'
      });
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
