const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

// POST /api/users/register
router.post('/register', usuarioController.registrar);

// POST /api/users/login
router.post('/login', usuarioController.login);

// ==========================================
// RUTAS PROTEGIDAS - PERFIL PROPIO
// ==========================================

// GET /api/users/profile
router.get('/profile', authenticate, usuarioController.obtenerPerfil);

// PUT /api/users/profile
router.put('/profile', authenticate, usuarioController.actualizarPerfil);

// PUT /api/users/password
router.put('/password', authenticate, usuarioController.cambiarPassword);

// POST /api/users/photo
router.post('/photo', authenticate, upload.single('foto'), usuarioController.subirFotoPerfil);

// GET /api/users/dashboard
router.get('/dashboard', authenticate, usuarioController.obtenerDashboard);

// GET /api/users/notifications
router.get('/notifications', authenticate, usuarioController.obtenerNotificaciones);

// ==========================================
// RUTAS PROTEGIDAS - ADMINISTRACIÓN
// ==========================================

// GET /api/users/ (listar todos - solo admin)
router.get('/', authenticate, authorize(['admin']), usuarioController.listarUsuarios);

// GET /api/users/:id (obtener por ID)
router.get('/:id', authenticate, usuarioController.obtenerUsuarioPorId);

// DELETE /api/users/:id (soft delete - solo admin)
router.delete('/:id', authenticate, authorize(['admin']), usuarioController.eliminarUsuario);

module.exports = router;
