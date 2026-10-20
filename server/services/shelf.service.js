const db = require('../config/db');
const Book = require('../models/book.model');
const Exchange = require('../models/exchange.model');
const Notification = require('./notification.service');
const { SHELF_LOCATION } = require('../constants/shelf');

function normalizeUid(value) {
  const uid = String(value || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
  if (uid.length < 4 || uid.length > 32) return '';
  return uid;
}

async function findBookIdByUid(uid) {
  const [rows] = await db.execute(
    'SELECT libro_id FROM tarjetas_rfid WHERE uid = ? LIMIT 1',
    [uid]
  );
  return rows[0] ? Number(rows[0].libro_id) : null;
}

async function findAcceptedExchange(bookId) {
  const [rows] = await db.execute(
    `SELECT id, solicitante_id, receptor_id, libro_solicitado_id, libro_ofrecido_id
     FROM intercambios
     WHERE activo = TRUE
       AND estado = 'aceptado'
       AND (libro_solicitado_id = ? OR libro_ofrecido_id = ?)
     ORDER BY fecha_respuesta DESC
     LIMIT 1`,
    [bookId, bookId]
  );
  return rows[0] || null;
}

async function findRecentCompletedExchange(bookId) {
  const [rows] = await db.execute(
    `SELECT id
     FROM intercambios
     WHERE activo = TRUE
       AND estado = 'completado'
       AND fecha_completado > (NOW() - INTERVAL 1 DAY)
       AND (libro_solicitado_id = ? OR libro_ofrecido_id = ?)
     ORDER BY fecha_completado DESC
     LIMIT 1`,
    [bookId, bookId]
  );
  return rows[0] || null;
}

async function bindCard(uidRaw, bookIdRaw) {
  const uid = normalizeUid(uidRaw);
  const bookId = Number(bookIdRaw);
  if (!uid) {
    const error = new Error('UID de tarjeta inválido');
    error.status = 400;
    throw error;
  }
  const book = await Book.findById(bookId);
  if (!book) {
    const error = new Error('Libro no encontrado');
    error.status = 404;
    throw error;
  }

  await db.execute(
    `INSERT INTO tarjetas_rfid (uid, libro_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE libro_id = VALUES(libro_id)`,
    [uid, bookId]
  );

  return { uid, bookId, title: book.title };
}

async function notifyUsers(userIds, payload) {
  for (const userId of userIds) {
    if (!userId) continue;
    try {
      await Notification.createNotification({ userId, ...payload });
    } catch (error) {
      console.warn('Aviso de estante sin notificación:', error.message);
    }
  }
}

async function handleShelfReading({ bookId, uid, event, weight }) {
  const normalizedEvent = String(event || 'removed').toLowerCase();
  const cleanUid = normalizeUid(uid);
  let resolvedBookId = Number(bookId) || null;

  if (!['removed', 'placed'].includes(normalizedEvent)) {
    const error = new Error('event debe ser "removed" o "placed"');
    error.status = 400;
    throw error;
  }

  if (!resolvedBookId && cleanUid) {
    resolvedBookId = await findBookIdByUid(cleanUid);
  }

  if (!resolvedBookId) {
    return {
      type: 'shelf',
      result: 'unknown',
      correct: false,
      uid: cleanUid,
      bookId: null,
      exchangeId: null,
      title: '',
      weight: weight ?? null,
      message: cleanUid
        ? `Tarjeta ${cleanUid} no está vinculada a un libro. Vincúlala en la ficha del libro.`
        : 'No llegó el UID ni el libro.'
    };
  }

  const book = await Book.findById(resolvedBookId);
  if (!book) {
    return {
      type: 'shelf',
      result: 'unknown',
      correct: false,
      uid: cleanUid,
      bookId: resolvedBookId,
      exchangeId: null,
      title: '',
      weight: weight ?? null,
      message: 'La tarjeta apunta a un libro que ya no existe.'
    };
  }

  const title = book.title || 'Libro';
  const exchange = await findAcceptedExchange(resolvedBookId);

  if (normalizedEvent === 'placed') {
    const correct = Boolean(exchange);
    if (exchange) {
      await notifyUsers([exchange.solicitante_id, exchange.receptor_id], {
        tipo: 'estante_deposito',
        titulo: 'Libro en el estante',
        mensaje: `"${title}" quedó en el ${SHELF_LOCATION}.`,
        exchangeId: exchange.id,
        bookId: resolvedBookId
      });
    }
    return {
      type: 'shelf',
      result: correct ? 'placed' : 'wrong',
      correct,
      uid: cleanUid,
      bookId: resolvedBookId,
      exchangeId: exchange?.id || null,
      title,
      weight: weight ?? null,
      message: correct
        ? `"${title}" se colocó en el estante. Es un libro del trueque.`
        : `"${title}" se colocó, pero no corresponde a un trueque aceptado.`
    };
  }

  if (exchange) {
    await Exchange.updateStatus(exchange.id, 'completed');
    await Book.updateStatus(exchange.libro_solicitado_id, 'exchanged');
    await Book.updateStatus(exchange.libro_ofrecido_id, 'exchanged');
    await notifyUsers([exchange.solicitante_id, exchange.receptor_id], {
      tipo: 'trueque_completado',
      titulo: 'Trueque realizado con éxito',
      mensaje: `Se retiró el libro correcto: "${title}". El trueque quedó completado en el ${SHELF_LOCATION}.`,
      exchangeId: exchange.id,
      bookId: resolvedBookId
    });
    return {
      type: 'shelf',
      result: 'completed',
      correct: true,
      uid: cleanUid,
      bookId: resolvedBookId,
      exchangeId: exchange.id,
      title,
      weight: weight ?? null,
      message: `Trueque realizado con éxito. Se retiró el libro correcto: "${title}".`
    };
  }

  const recent = await findRecentCompletedExchange(resolvedBookId);
  if (recent) {
    return {
      type: 'shelf',
      result: 'completed',
      correct: true,
      uid: cleanUid,
      bookId: resolvedBookId,
      exchangeId: recent.id,
      title,
      weight: weight ?? null,
      message: `Retiro correcto: "${title}" ya formaba parte del trueque.`
    };
  }

  return {
    type: 'shelf',
    result: 'wrong',
    correct: false,
    uid: cleanUid,
    bookId: resolvedBookId,
    exchangeId: null,
    title,
    weight: weight ?? null,
    message: `Ese no es el libro del trueque. "${title}" no tiene un trueque aceptado.`
  };
}

module.exports = {
  normalizeUid,
  bindCard,
  handleShelfReading
};
