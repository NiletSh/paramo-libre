const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generarToken } = require('../utils/jwt');

const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
const MAX_LOGIN_ATTEMPTS = isDevelopment ? 20 : 5;
const LOGIN_WINDOW_MS = (isDevelopment ? 1 : 15) * 60 * 1000;
const LOGIN_WINDOW_MINUTES = Math.ceil(LOGIN_WINDOW_MS / 60000);
const loginAttempts = new Map();

// Helper para eliminar password de la respuesta
const usuarioSinPassword = (usuario) => {
  const { password_hash, ...resto } = usuario;
  return resto;
};

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const buildUploadUrl = (path = '') => path || null;

const statusFromDb = {
  pendiente: 'pending',
  aceptado: 'accepted',
  rechazado: 'rejected',
  cancelado: 'cancelled',
  completado: 'completed'
};

const bookStatusFromDb = {
  disponible: 'available',
  en_intercambio: 'reserved',
  intercambiado: 'exchanged',
  pausado: 'reserved'
};

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return '';

  const diffMs = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} dias`;

  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
};

const getLoginKey = (req, email) => `${req.ip || req.socket.remoteAddress || 'local'}:${normalizeEmail(email)}`;

const isLoginBlocked = (key) => {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;

  if (Date.now() > attempt.expiresAt) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.count >= MAX_LOGIN_ATTEMPTS;
};

const registerFailedLogin = (key) => {
  const current = loginAttempts.get(key);
  const expiresAt = Date.now() + LOGIN_WINDOW_MS;

  loginAttempts.set(key, {
    count: current && Date.now() <= current.expiresAt ? current.count + 1 : 1,
    expiresAt
  });
};

const usuarioController = {
  // REGISTRO
  registrar: async (req, res) => {
    try {
      const { nombre, password, ubicacion, telefono } = req.body;
      const email = normalizeEmail(req.body.email);

      if (!nombre || !email || !password) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Nombre, email y contraseña son obligatorios.'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La contraseña debe tener al menos 8 caracteres.'
        });
      }

      // Verificar si el email ya existe
      const [existente] = await pool.execute(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if (existente.length > 0) {
        return res.status(409).json({
          exito: false,
          mensaje: 'Ya existe una cuenta con este correo electrónico.'
        });
      }

      // Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Insertar usuario
      const [resultado] = await pool.execute(
        `INSERT INTO usuarios (nombre, email, password_hash, ubicacion, telefono) 
         VALUES (?, ?, ?, ?, ?)`,
        [nombre, email, password_hash, ubicacion || null, telefono || null]
      );

      // Obtener usuario creado
      const [usuarios] = await pool.execute(
        'SELECT * FROM usuarios WHERE id = ?',
        [resultado.insertId]
      );

      const usuario = usuarios[0];
      const token = generarToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

      res.status(201).json({
        exito: true,
        mensaje: 'Usuario registrado exitosamente.',
        token,
        usuario: usuarioSinPassword(usuario)
      });
    } catch (error) {
      console.error('Error en registrar:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al registrar el usuario.',
        error: error.message
      });
    }
  },

  // LOGIN
  login: async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      const { password } = req.body;
      const loginKey = getLoginKey(req, email);

      if (!email || !password) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Email y contraseña son obligatorios.'
        });
      }

      if (isLoginBlocked(loginKey)) {
        return res.status(429).json({
          exito: false,
          mensaje: `Demasiados intentos. Espera ${LOGIN_WINDOW_MINUTES} minuto${LOGIN_WINDOW_MINUTES === 1 ? '' : 's'} antes de volver a intentar.`
        });
      }

      const [usuarios] = await pool.execute(
        'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
        [email]
      );

      if (usuarios.length === 0) {
        registerFailedLogin(loginKey);
        return res.status(401).json({
          exito: false,
          mensaje: 'Credenciales inválidas.'
        });
      }

      const usuario = usuarios[0];
      const passwordValido = await bcrypt.compare(password, usuario.password_hash);

      if (!passwordValido) {
        registerFailedLogin(loginKey);
        return res.status(401).json({
          exito: false,
          mensaje: 'Credenciales inválidas.'
        });
      }

      // Actualizar última conexión
      await pool.execute(
        'UPDATE usuarios SET ultima_conexion = NOW() WHERE id = ?',
        [usuario.id]
      );

      loginAttempts.delete(loginKey);

      const token = generarToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

      res.json({
        exito: true,
        mensaje: 'Inicio de sesión exitoso.',
        token,
        usuario: usuarioSinPassword(usuario)
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al iniciar sesión.',
        error: error.message
      });
    }
  },

  // OBTENER PERFIL PROPIO
  obtenerPerfil: async (req, res) => {
    try {
      const [usuarios] = await pool.execute(
        `SELECT u.id, u.nombre, u.email, u.foto_perfil, u.biografia, 
                u.ubicacion, u.telefono, u.rol, u.fecha_registro, u.ultima_conexion,
                c.notificaciones_email, c.tema, c.privacidad_perfil, c.idioma,
                (SELECT COUNT(*) FROM libros l WHERE l.usuario_id = u.id AND l.activo = TRUE) AS libros_publicados,
                (SELECT COUNT(*) FROM intercambios i WHERE (i.solicitante_id = u.id OR i.receptor_id = u.id) AND i.estado = 'completado' AND i.activo = TRUE) AS intercambios_completados
         FROM usuarios u
         LEFT JOIN configuraciones_usuario c ON u.id = c.usuario_id
         WHERE u.id = ? AND u.activo = TRUE`,
        [req.usuario.id]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Usuario no encontrado.'
        });
      }

      res.json({
        exito: true,
        usuario: usuarios[0]
      });
    } catch (error) {
      console.error('Error en obtenerPerfil:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener el perfil.'
      });
    }
  },

  // ACTUALIZAR PERFIL
  actualizarPerfil: async (req, res) => {
    try {
      const { nombre, biografia, ubicacion, telefono } = req.body;
      const email = req.body.email ? normalizeEmail(req.body.email) : null;
      const usuarioId = req.usuario.id;

      if (!nombre || !email) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Nombre y email son obligatorios.'
        });
      }

      const [emailExistente] = await pool.execute(
        'SELECT id FROM usuarios WHERE email = ? AND id <> ? AND activo = TRUE',
        [email, usuarioId]
      );

      if (emailExistente.length > 0) {
        return res.status(409).json({
          exito: false,
          mensaje: 'Ya existe una cuenta con este correo electronico.'
        });
      }

      await pool.execute(
        `UPDATE usuarios 
         SET nombre = ?, email = ?, biografia = ?, ubicacion = ?, telefono = ?
         WHERE id = ?`,
        [
          nombre,
          email,
          biografia || null,
          ubicacion || null,
          telefono || null,
          usuarioId
        ]
      );

      const [usuarios] = await pool.execute(
        'SELECT id, nombre, email, foto_perfil, biografia, ubicacion, telefono, rol FROM usuarios WHERE id = ?',
        [usuarioId]
      );

      res.json({
        exito: true,
        mensaje: 'Perfil actualizado exitosamente.',
        usuario: usuarios[0]
      });
    } catch (error) {
      console.error('Error en actualizarPerfil:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al actualizar el perfil.'
      });
    }
  },

  // CAMBIAR CONTRASEÑA
  cambiarPassword: async (req, res) => {
    try {
      const { passwordActual, passwordNuevo } = req.body;
      const usuarioId = req.usuario.id;

      if (!passwordActual || !passwordNuevo) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debes proporcionar la contraseña actual y la nueva.'
        });
      }

      if (passwordNuevo.length < 8) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.'
        });
      }

      const [usuarios] = await pool.execute(
        'SELECT password_hash FROM usuarios WHERE id = ?',
        [usuarioId]
      );

      const passwordValido = await bcrypt.compare(passwordActual, usuarios[0].password_hash);

      if (!passwordValido) {
        return res.status(401).json({
          exito: false,
          mensaje: 'La contraseña actual es incorrecta.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const nuevoHash = await bcrypt.hash(passwordNuevo, salt);

      await pool.execute(
        'UPDATE usuarios SET password_hash = ? WHERE id = ?',
        [nuevoHash, usuarioId]
      );

      res.json({
        exito: true,
        mensaje: 'Contraseña actualizada exitosamente.'
      });
    } catch (error) {
      console.error('Error en cambiarPassword:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al cambiar la contraseña.'
      });
    }
  },

  // SUBIR FOTO DE PERFIL
  subirFotoPerfil: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          exito: false,
          mensaje: 'No se proporcionó ninguna imagen.'
        });
      }

      const fotoUrl = `/uploads/profiles/${req.file.filename}`;

      await pool.execute(
        'UPDATE usuarios SET foto_perfil = ? WHERE id = ?',
        [fotoUrl, req.usuario.id]
      );

      res.json({
        exito: true,
        mensaje: 'Foto de perfil actualizada exitosamente.',
        foto_perfil: fotoUrl
      });
    } catch (error) {
      console.error('Error en subirFotoPerfil:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al subir la foto de perfil.'
      });
    }
  },

  obtenerDashboard: async (req, res) => {
    try {
      const usuarioId = req.usuario.id;

      const [statsRows] = await pool.execute(
        `SELECT
          SUM(CASE WHEN solicitante_id = ? THEN 1 ELSE 0 END) AS propuestas_enviadas,
          SUM(CASE WHEN receptor_id = ? THEN 1 ELSE 0 END) AS solicitudes_recibidas,
          SUM(CASE WHEN (solicitante_id = ? OR receptor_id = ?) AND estado = 'completado' THEN 1 ELSE 0 END) AS trueques_realizados
         FROM intercambios
         WHERE activo = TRUE`,
        [usuarioId, usuarioId, usuarioId, usuarioId]
      );

      const [bookCountRows] = await pool.execute(
        `SELECT COUNT(*) AS libros_publicados
         FROM libros
         WHERE usuario_id = ? AND activo = TRUE`,
        [usuarioId]
      );

      const [booksRows] = await pool.execute(
        `SELECT id, titulo, autor, estado_publicacion, imagen_portada
         FROM libros
         WHERE usuario_id = ? AND activo = TRUE
         ORDER BY fecha_publicacion DESC
         LIMIT 3`,
        [usuarioId]
      );

      const [activityRows] = await pool.execute(
        `SELECT i.id, i.estado, i.fecha_propuesta, i.fecha_respuesta, i.fecha_completado,
                i.solicitante_id, i.receptor_id,
                ls.titulo AS libro_solicitado,
                lo.titulo AS libro_ofrecido,
                us.nombre AS solicitante_nombre,
                ur.nombre AS receptor_nombre
         FROM intercambios i
         JOIN libros ls ON i.libro_solicitado_id = ls.id
         JOIN libros lo ON i.libro_ofrecido_id = lo.id
         JOIN usuarios us ON i.solicitante_id = us.id
         JOIN usuarios ur ON i.receptor_id = ur.id
         WHERE i.activo = TRUE AND (i.solicitante_id = ? OR i.receptor_id = ?)
         ORDER BY COALESCE(i.fecha_completado, i.fecha_respuesta, i.fecha_propuesta) DESC
         LIMIT 5`,
        [usuarioId, usuarioId]
      );

      const stats = statsRows[0] || {};
      const recentBooks = booksRows.map((book) => ({
        id: book.id,
        title: book.titulo,
        author: book.autor,
        status: bookStatusFromDb[book.estado_publicacion] || 'available',
        imageUrl: buildUploadUrl(book.imagen_portada)
      }));

      const activities = activityRows.map((activity) => {
        const isRequester = activity.solicitante_id === usuarioId;
        const date = activity.fecha_completado || activity.fecha_respuesta || activity.fecha_propuesta;
        const status = statusFromDb[activity.estado] || activity.estado;

        const labels = {
          pending: isRequester
            ? `Enviaste una propuesta por "${activity.libro_solicitado}"`
            : `Recibiste una propuesta de ${activity.solicitante_nombre}`,
          accepted: `Propuesta aceptada para "${activity.libro_solicitado}"`,
          rejected: `Propuesta rechazada para "${activity.libro_solicitado}"`,
          cancelled: `Propuesta cancelada para "${activity.libro_solicitado}"`,
          completed: `Trueque completado: "${activity.libro_solicitado}"`
        };

        const icons = {
          pending: isRequester ? 'send' : 'inbox',
          accepted: 'check_circle',
          rejected: 'cancel',
          cancelled: 'remove_circle',
          completed: 'published_with_changes'
        };

        return {
          id: activity.id,
          message: labels[status] || `Movimiento en "${activity.libro_solicitado}"`,
          time: formatRelativeTime(date),
          icon: icons[status] || 'notifications',
          status
        };
      });

      res.json({
        exito: true,
        data: {
          stats: {
            propuestas: Number(stats.propuestas_enviadas || 0),
            solicitudes: Number(stats.solicitudes_recibidas || 0),
            truequesRealizados: Number(stats.trueques_realizados || 0),
            librosPublicados: Number(bookCountRows[0]?.libros_publicados || 0)
          },
          recentBooks,
          activities
        }
      });
    } catch (error) {
      console.error('Error en obtenerDashboard:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener la informacion del panel.'
      });
    }
  },

  obtenerNotificaciones: async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT i.id, i.estado, i.fecha_propuesta, i.fecha_respuesta, i.fecha_completado,
                i.solicitante_id, i.receptor_id,
                ls.titulo AS libro_solicitado,
                us.nombre AS solicitante_nombre
         FROM intercambios i
         JOIN libros ls ON i.libro_solicitado_id = ls.id
         JOIN usuarios us ON i.solicitante_id = us.id
         WHERE i.activo = TRUE AND (i.solicitante_id = ? OR i.receptor_id = ?)
         ORDER BY COALESCE(i.fecha_completado, i.fecha_respuesta, i.fecha_propuesta) DESC
         LIMIT 20`,
        [req.usuario.id, req.usuario.id]
      );

      const notificaciones = rows.map((row) => ({
        id: row.id,
        tipo: statusFromDb[row.estado] || row.estado,
        mensaje: row.receptor_id === req.usuario.id
          ? `${row.solicitante_nombre} envio una propuesta por "${row.libro_solicitado}"`
          : `Tu propuesta por "${row.libro_solicitado}" esta ${row.estado}`,
        fecha: row.fecha_completado || row.fecha_respuesta || row.fecha_propuesta
      }));

      res.json({ exito: true, notificaciones });
    } catch (error) {
      console.error('Error en obtenerNotificaciones:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener las notificaciones.'
      });
    }
  },

  // LISTAR TODOS LOS USUARIOS (Admin)
  listarUsuarios: async (req, res) => {
    try {
      const [usuarios] = await pool.execute(
        `SELECT id, nombre, email, foto_perfil, ubicacion, rol, activo, 
                fecha_registro, ultima_conexion 
         FROM usuarios 
         ORDER BY fecha_registro DESC`
      );

      res.json({
        exito: true,
        total: usuarios.length,
        usuarios
      });
    } catch (error) {
      console.error('Error en listarUsuarios:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener la lista de usuarios.'
      });
    }
  },

  // OBTENER USUARIO POR ID
  obtenerUsuarioPorId: async (req, res) => {
    try {
      const { id } = req.params;

      const [usuarios] = await pool.execute(
        `SELECT id, nombre, email, foto_perfil, biografia, ubicacion, 
                telefono, rol, fecha_registro 
         FROM usuarios 
         WHERE id = ? AND activo = TRUE`,
        [id]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Usuario no encontrado.'
        });
      }

      res.json({
        exito: true,
        usuario: usuarios[0]
      });
    } catch (error) {
      console.error('Error en obtenerUsuarioPorId:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener el usuario.'
      });
    }
  },

  // ELIMINAR USUARIO (Admin - Soft delete)
  eliminarUsuario: async (req, res) => {
    try {
      const { id } = req.params;

      // No permitir eliminarse a sí mismo
      if (parseInt(id) === req.usuario.id) {
        return res.status(400).json({
          exito: false,
          mensaje: 'No puedes eliminar tu propia cuenta desde aquí.'
        });
      }

      await pool.execute(
        'UPDATE usuarios SET activo = FALSE WHERE id = ?',
        [id]
      );

      res.json({
        exito: true,
        mensaje: 'Usuario desactivado exitosamente.'
      });
    } catch (error) {
      console.error('Error en eliminarUsuario:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al desactivar el usuario.'
      });
    }
  }
};

module.exports = usuarioController;
