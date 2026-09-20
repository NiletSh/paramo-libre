const jwt = require('jsonwebtoken');

const verificarAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Acceso denegado. Token no proporcionado.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'paramo_libre_secret_key');
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Token inválido o expirado.'
    });
  }
};

const esAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.rol === 'admin') {
    return next();
  }
  return res.status(403).json({
    exito: false,
    mensaje: 'Acceso denegado. Se requieren privilegios de administrador.'
  });
};

module.exports = {
  verificarAuth,
  esAdmin
};