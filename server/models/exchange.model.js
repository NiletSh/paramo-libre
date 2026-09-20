const db = require('../config/db');

const statusToDb = {
  pending: 'pendiente',
  accepted: 'aceptado',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  completed: 'completado',
  pendiente: 'pendiente',
  aceptado: 'aceptado',
  rechazado: 'rechazado',
  cancelado: 'cancelado',
  completado: 'completado'
};

const statusFromDb = {
  pendiente: 'pending',
  aceptado: 'accepted',
  rechazado: 'rejected',
  cancelado: 'cancelled',
  completado: 'completed'
};

const normalize = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    requester_id: row.solicitante_id,
    requesterId: row.solicitante_id,
    owner_id: row.receptor_id,
    ownerId: row.receptor_id,
    book_id: row.libro_solicitado_id,
    requestedBookId: row.libro_solicitado_id,
    offered_book_id: row.libro_ofrecido_id,
    offeredBookId: row.libro_ofrecido_id,
    status: statusFromDb[row.estado] || row.estado,
    message: row.mensaje,
    created_at: row.fecha_propuesta,
    createdAt: row.fecha_propuesta,
    book_title: row.book_title,
    requestedBookTitle: row.book_title,
    book_image: row.book_image,
    requestedBookImage: row.book_image,
    offered_book_title: row.offered_book_title,
    offeredBookTitle: row.offered_book_title,
    offered_book_image: row.offered_book_image,
    offeredBookImage: row.offered_book_image,
    requester_name: row.requester_name,
    proposerUserName: row.requester_name,
    owner_name: row.owner_name,
    ownerName: row.owner_name
  };
};

const baseSelect = `
  SELECT
    i.*,
    ls.titulo AS book_title,
    ls.imagen_portada AS book_image,
    lo.titulo AS offered_book_title,
    lo.imagen_portada AS offered_book_image,
    us.nombre AS requester_name,
    us.email AS requester_email,
    us.foto_perfil AS requester_avatar,
    ur.nombre AS owner_name,
    ur.email AS owner_email,
    ur.foto_perfil AS owner_avatar
  FROM intercambios i
  JOIN libros ls ON i.libro_solicitado_id = ls.id
  JOIN libros lo ON i.libro_ofrecido_id = lo.id
  JOIN usuarios us ON i.solicitante_id = us.id
  JOIN usuarios ur ON i.receptor_id = ur.id
  WHERE i.activo = TRUE
`;

const Exchange = {
  create: async (exchange) => {
    const { requester_id, owner_id, book_id, offered_book_id, message } = exchange;
    const [result] = await db.execute(
      `INSERT INTO intercambios
        (solicitante_id, receptor_id, libro_solicitado_id, libro_ofrecido_id, mensaje, estado)
       VALUES (?, ?, ?, ?, ?, 'pendiente')`,
      [requester_id, owner_id, book_id, offered_book_id, message || null]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await db.execute(`${baseSelect} AND i.id = ?`, [id]);
    return normalize(rows[0]);
  },

  findByRequesterId: async (requesterId) => {
    const [rows] = await db.execute(
      `${baseSelect} AND i.solicitante_id = ? ORDER BY i.fecha_propuesta DESC`,
      [requesterId]
    );
    return rows.map(normalize);
  },

  findByOwnerId: async (ownerId) => {
    const [rows] = await db.execute(
      `${baseSelect} AND i.receptor_id = ? ORDER BY i.fecha_propuesta DESC`,
      [ownerId]
    );
    return rows.map(normalize);
  },

  findHistoryByUserId: async (userId) => {
    const [rows] = await db.execute(
      `${baseSelect} AND (i.solicitante_id = ? OR i.receptor_id = ?) ORDER BY i.fecha_propuesta DESC`,
      [userId, userId]
    );
    return rows.map(normalize);
  },

  updateStatus: async (id, status) => {
    const dbStatus = statusToDb[status] || status;
    const fields = ['estado = ?'];
    const params = [dbStatus];

    if (['aceptado', 'rechazado', 'cancelado'].includes(dbStatus)) {
      fields.push('fecha_respuesta = NOW()');
    }

    if (dbStatus === 'completado') {
      fields.push('fecha_completado = NOW()');
    }

    const [result] = await db.execute(
      `UPDATE intercambios SET ${fields.join(', ')} WHERE id = ?`,
      [...params, id]
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `UPDATE intercambios SET activo = FALSE WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  countByUser: async (userId) => {
    const [rows] = await db.execute(
      `SELECT
        SUM(CASE WHEN solicitante_id = ? THEN 1 ELSE 0 END) AS sent,
        SUM(CASE WHEN receptor_id = ? THEN 1 ELSE 0 END) AS received
       FROM intercambios
       WHERE activo = TRUE`,
      [userId, userId]
    );
    return rows[0];
  }
};

module.exports = Exchange;
