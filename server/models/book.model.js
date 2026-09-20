const db = require('../config/db');

const conditionToDb = {
  new: 'nuevo',
  like_new: 'como_nuevo',
  good: 'buen_estado',
  fair: 'usado',
  nuevo: 'nuevo',
  como_nuevo: 'como_nuevo',
  buen_estado: 'buen_estado',
  usado: 'usado',
  muy_usado: 'muy_usado'
};

const statusToDb = {
  available: 'disponible',
  reserved: 'en_intercambio',
  exchanged: 'intercambiado',
  paused: 'pausado',
  disponible: 'disponible',
  en_intercambio: 'en_intercambio',
  intercambiado: 'intercambiado',
  pausado: 'pausado'
};

class Book {
  static normalize(row) {
    if (!row) return null;

    return {
      id: row.id,
      user_id: row.usuario_id,
      ownerId: row.usuario_id,
      category_id: row.categoria_id,
      categoryId: row.categoria_id,
      title: row.titulo,
      author: row.autor,
      isbn: row.isbn,
      description: row.descripcion,
      condition_status: row.condition_status,
      condition: row.condition_status,
      status: row.status,
      location: row.ubicacion,
      image_url: row.imagen_portada,
      imageUrl: row.imagen_portada,
      created_at: row.fecha_publicacion,
      createdAt: row.fecha_publicacion,
      updated_at: row.fecha_actualizacion,
      updatedAt: row.fecha_actualizacion,
      category_name: row.category_name,
      categoryName: row.category_name,
      owner_name: row.owner_name,
      ownerName: row.owner_name,
      owner_email: row.owner_email,
      ownerEmail: row.owner_email,
      owner_image: row.owner_image,
      ownerImage: row.owner_image
    };
  }

  static conditionFromDbExpression() {
    return `
      CASE l.estado_libro
        WHEN 'nuevo' THEN 'new'
        WHEN 'como_nuevo' THEN 'like_new'
        WHEN 'buen_estado' THEN 'good'
        ELSE 'fair'
      END
    `;
  }

  static statusFromDbExpression() {
    return `
      CASE l.estado_publicacion
        WHEN 'disponible' THEN 'available'
        WHEN 'en_intercambio' THEN 'reserved'
        WHEN 'intercambiado' THEN 'exchanged'
        ELSE 'reserved'
      END
    `;
  }

  static baseSelect() {
    return `
      SELECT
        l.id,
        l.usuario_id,
        l.categoria_id,
        l.titulo,
        l.autor,
        l.isbn,
        l.descripcion,
        ${Book.conditionFromDbExpression()} AS condition_status,
        ${Book.statusFromDbExpression()} AS status,
        l.ubicacion,
        l.imagen_portada,
        l.fecha_publicacion,
        l.fecha_actualizacion,
        c.nombre AS category_name,
        u.nombre AS owner_name,
        u.email AS owner_email,
        u.foto_perfil AS owner_image
      FROM libros l
      LEFT JOIN categorias c ON l.categoria_id = c.id
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.activo = TRUE
    `;
  }

  static addFilters(query, params, filters = {}) {
    let sql = query;

    if (filters.search) {
      sql += ` AND (l.titulo LIKE ? OR l.autor LIKE ? OR l.descripcion LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.category_id) {
      sql += ` AND l.categoria_id = ?`;
      params.push(filters.category_id);
    }

    if (filters.category) {
      sql += ` AND c.nombre = ?`;
      params.push(filters.category);
    }

    if (filters.condition_status) {
      sql += ` AND l.estado_libro = ?`;
      params.push(conditionToDb[filters.condition_status] || filters.condition_status);
    }

    if (filters.location) {
      sql += ` AND l.ubicacion LIKE ?`;
      params.push(`%${filters.location}%`);
    }

    if (filters.status) {
      sql += ` AND l.estado_publicacion = ?`;
      params.push(statusToDb[filters.status] || filters.status);
    }

    if (filters.user_id) {
      sql += ` AND l.usuario_id = ?`;
      params.push(filters.user_id);
    }

    return sql;
  }

  static async resolveCategoryId(categoryId, categoryName) {
    if (categoryId) return categoryId;
    if (!categoryName) return null;

    const [rows] = await db.execute(
      'SELECT id FROM categorias WHERE nombre = ? AND activo = TRUE LIMIT 1',
      [categoryName]
    );

    return rows[0]?.id || null;
  }

  static async findAll(filters = {}) {
    const params = [];
    let query = Book.addFilters(Book.baseSelect(), params, filters);
    query += ` ORDER BY l.fecha_publicacion DESC`;

    const page = Number.parseInt(filters.page, 10) || 1;
    const limit = Number.parseInt(filters.limit, 10) || 12;
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(query, params);

    const countParams = [];
    const countBase = `
      SELECT COUNT(*) AS total
      FROM libros l
      LEFT JOIN categorias c ON l.categoria_id = c.id
      WHERE l.activo = TRUE
    `;
    const countQuery = Book.addFilters(countBase, countParams, filters);
    const [countRows] = await db.query(countQuery, countParams);

    return {
      books: rows.map(Book.normalize),
      total: countRows[0].total,
      page,
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  }

  static async findById(id) {
    const [rows] = await db.execute(`${Book.baseSelect()} AND l.id = ?`, [id]);
    return Book.normalize(rows[0]);
  }

  static async create(bookData) {
    const {
      title,
      author,
      description,
      category_id,
      category,
      condition_status,
      condition,
      location,
      image_url,
      user_id
    } = bookData;

    const resolvedCategoryId = await Book.resolveCategoryId(category_id, category);
    const dbCondition = conditionToDb[condition_status || condition] || 'buen_estado';

    const [result] = await db.execute(
      `INSERT INTO libros
        (usuario_id, categoria_id, titulo, autor, descripcion, estado_libro, estado_publicacion, ubicacion, imagen_portada)
       VALUES (?, ?, ?, ?, ?, ?, 'disponible', ?, ?)`,
      [
        user_id,
        resolvedCategoryId,
        title,
        author,
        description || '',
        dbCondition,
        location || null,
        image_url || null
      ]
    );

    return result.insertId;
  }

  static async update(id, bookData) {
    const {
      title,
      author,
      description,
      category_id,
      category,
      condition_status,
      condition,
      location,
      image_url,
      status
    } = bookData;

    const resolvedCategoryId = await Book.resolveCategoryId(category_id, category);
    const dbCondition = conditionToDb[condition_status || condition] || 'buen_estado';
    const dbStatus = statusToDb[status] || 'disponible';

    let query = `
      UPDATE libros
      SET titulo = ?, autor = ?, descripcion = ?, categoria_id = ?,
          estado_libro = ?, ubicacion = ?, estado_publicacion = ?
    `;
    const params = [
      title,
      author,
      description || '',
      resolvedCategoryId,
      dbCondition,
      location || null,
      dbStatus
    ];

    if (image_url !== undefined) {
      query += `, imagen_portada = ?`;
      params.push(image_url);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const [result] = await db.execute(query, params);
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await db.execute(
      `UPDATE libros SET activo = FALSE WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }

  static async updateStatus(id, status) {
    const [result] = await db.execute(
      `UPDATE libros SET estado_publicacion = ? WHERE id = ?`,
      [statusToDb[status] || status, id]
    );
    return result.affectedRows;
  }
}

module.exports = Book;
