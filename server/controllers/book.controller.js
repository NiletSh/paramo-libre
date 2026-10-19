const Book = require('../models/book.model');
const db = require('../config/db');

async function saveCover(bookId, file) {
  const [existente] = await db.execute(
    'SELECT libro_id FROM fotos_libros WHERE libro_id = ?',
    [bookId]
  );

  if (existente.length > 0) {
    await db.execute(
      'UPDATE fotos_libros SET mime = ?, datos = ? WHERE libro_id = ?',
      [file.mimetype, file.buffer, bookId]
    );
  } else {
    await db.execute(
      'INSERT INTO fotos_libros (libro_id, mime, datos) VALUES (?, ?, ?)',
      [bookId, file.mimetype, file.buffer]
    );
  }

  return `/api/books/${bookId}/cover?v=${Date.now()}`;
}

exports.getAllBooks = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      category_id: req.query.category_id,
      category: req.query.category,
      condition_status: req.query.condition_status || req.query.condition,
      location: req.query.location,
      status: req.query.status || 'available',
      user_id: req.query.user_id,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await Book.findAll(filters);

    res.json({
      success: true,
      data: result.books,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: parseInt(req.query.limit, 10) || 12
      }
    });
  } catch (error) {
    console.error('Error al obtener libros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los libros',
      error: error.message
    });
  }
};

exports.getCover = async (req, res) => {
  try {
    const bookId = Number(req.params.id);
    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(404).json({ success: false, message: 'Portada no encontrada' });
    }

    const [fotos] = await db.execute(
      'SELECT mime, datos FROM fotos_libros WHERE libro_id = ?',
      [bookId]
    );

    if (fotos.length === 0 || !fotos[0].datos) {
      return res.status(404).json({ success: false, message: 'Portada no encontrada' });
    }

    const imagen = Buffer.isBuffer(fotos[0].datos) ? fotos[0].datos : Buffer.from(fotos[0].datos);
    res.set('Content-Type', fotos[0].mime || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(imagen);
  } catch (error) {
    console.error('Error al obtener portada:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la portada' });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Libro no encontrado' });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    console.error('Error al obtener libro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el libro',
      error: error.message
    });
  }
};

exports.createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      category_id,
      category,
      condition_status,
      condition,
      location,
    } = req.body;

    if (!title || !author || (!category_id && !category) || (!condition_status && !condition)) {
      return res.status(400).json({
        success: false,
        message: 'Los campos titulo, autor, categoria y estado son obligatorios'
      });
    }

    const bookId = await Book.create({
      title,
      author,
      description,
      category_id,
      category,
      condition_status,
      condition,
      location,
      image_url: null,
      user_id: req.userId
    });

    if (req.file) {
      const image_url = await saveCover(bookId, req.file);
      await Book.updateCover(bookId, image_url);
    }

    const book = await Book.findById(bookId);

    res.status(201).json({
      success: true,
      message: 'Libro publicado exitosamente',
      data: book
    });
  } catch (error) {
    console.error('Error al crear libro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al publicar el libro',
      error: error.message
    });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      category_id,
      category,
      condition_status,
      condition,
      location,
      status
    } = req.body;

    if (!title || !author || (!category_id && !category) || (!condition_status && !condition)) {
      return res.status(400).json({
        success: false,
        message: 'Los campos titulo, autor, categoria y estado son obligatorios'
      });
    }

    const existingBook = await Book.findById(req.params.id);
    if (!existingBook) {
      return res.status(404).json({ success: false, message: 'Libro no encontrado' });
    }

    if (existingBook.user_id !== req.userId && req.usuario?.rol !== 'admin') {
      return res.status(403).json({ success: false, message: 'No puedes editar un libro que no te pertenece' });
    }

    const image_url = req.file ? await saveCover(req.params.id, req.file) : undefined;

    await Book.update(req.params.id, {
      title,
      author,
      description,
      category_id,
      category,
      condition_status,
      condition,
      location,
      image_url,
      status: status || existingBook.status
    });

    const book = await Book.findById(req.params.id);
    res.json({ success: true, message: 'Libro actualizado exitosamente', data: book });
  } catch (error) {
    console.error('Error al actualizar libro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el libro',
      error: error.message
    });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const existingBook = await Book.findById(req.params.id);
    if (!existingBook) {
      return res.status(404).json({ success: false, message: 'Libro no encontrado' });
    }

    if (existingBook.user_id !== req.userId && req.usuario?.rol !== 'admin') {
      return res.status(403).json({ success: false, message: 'No puedes eliminar un libro que no te pertenece' });
    }

    await Book.delete(req.params.id);
    res.json({ success: true, message: 'Libro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar libro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el libro',
      error: error.message
    });
  }
};

exports.getBooksByUser = async (req, res) => {
  try {
    const filters = {
      user_id: req.params.user_id,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await Book.findAll(filters);

    res.json({
      success: true,
      data: result.books,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error al obtener libros del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los libros del usuario',
      error: error.message
    });
  }
};
