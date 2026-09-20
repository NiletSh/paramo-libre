const UserModel = require('../models/user.model');
const db = require('../config/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth.utils');

class UserController {
  // Registro
  static async register(req, res) {
    try {
      const { nombre, apellido, email, password, telefono, ciudad } = req.body;

      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son obligatorios.'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres.'
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta con este correo electrónico.'
        });
      }

      const hashedPassword = await hashPassword(password);
      const userId = await UserModel.create({
        nombre,
        apellido,
        email,
        password: hashedPassword,
        telefono,
        ciudad
      });

      const token = generateToken({
        id: userId,
        email,
        nombre,
        rol: 'usuario'
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente.',
        data: {
          token,
          user: {
            id: userId,
            nombre,
            email,
            rol: 'usuario'
          }
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar el usuario.',
        error: error.message
      });
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son obligatorios.'
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.'
        });
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.'
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      });

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso.',
        data: {
          token,
          user: {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            telefono: user.telefono,
            ciudad: user.ciudad,
            foto_perfil: user.foto_perfil,
            rol: user.rol
          }
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión.',
        error: error.message
      });
    }
  }

  // Obtener mi perfil
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el perfil.'
      });
    }
  }

  // Actualizar mi perfil
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { nombre, apellido, telefono, ciudad } = req.body;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio.'
        });
      }

      const updated = await UserModel.update(userId, {
        nombre,
        apellido,
        telefono,
        ciudad
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      const user = await UserModel.findById(userId);

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente.',
        data: { user }
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el perfil.'
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual y la nueva son obligatorias.'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 8 caracteres.'
        });
      }

      const user = await UserModel.findByIdWithPassword(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      const isCurrentValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentValid) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta.'
        });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await UserModel.updatePassword(userId, hashedNewPassword);

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente.'
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar la contraseña.'
      });
    }
  }

  // Subir foto de perfil
  static async uploadPhoto(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ninguna imagen.'
        });
      }

      const userId = req.user.id;
      const fotoPath = `/uploads/profiles/${req.file.filename}`;

      await UserModel.updatePhoto(userId, fotoPath);

      res.status(200).json({
        success: true,
        message: 'Foto de perfil actualizada exitosamente.',
        data: { foto_perfil: fotoPath }
      });
    } catch (error) {
      console.error('Error al subir foto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la foto de perfil.'
      });
    }
  }

  // Listar todos los usuarios (Admin)
  static async getAllUsers(req, res) {
    try {
      const users = await UserModel.findAll();
      res.status(200).json({
        success: true,
        count: users.length,
        data: { users }
      });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de usuarios.'
      });
    }
  }

  // Obtener usuario por ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el usuario.'
      });
    }
  }

  // Actualizar usuario (Admin o dueño)
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { nombre, apellido, telefono, ciudad } = req.body;
      const targetId = parseInt(id);
      const isAdmin = req.user.rol === 'admin';
      const isOwner = targetId === req.user.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para editar este usuario.'
        });
      }

      const updated = await UserModel.update(targetId, {
        nombre,
        apellido,
        telefono,
        ciudad
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      const user = await UserModel.findById(targetId);

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente.',
        data: { user }
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el usuario.'
      });
    }
  }

  // Eliminar usuario (soft delete)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const targetId = parseInt(id);
      const isAdmin = req.user.rol === 'admin';
      const isOwner = targetId === req.user.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar este usuario.'
        });
      }

      const deleted = await UserModel.delete(targetId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente.'
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el usuario.'
      });
    }
  }
}

module.exports = UserController;
module.exports = UserController;
