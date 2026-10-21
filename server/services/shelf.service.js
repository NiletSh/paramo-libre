const db = require('../config/db');
const Book = require('../models/book.model');
const Exchange = require('../models/exchange.model');
const Notification = require('./notification.service');

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
    `SELECT id, solicitante_id, receptor_id, libro_solicitado_id, libro_ofrecido_id
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

async function notifyRemoval(book, exchange) {
  const title = book.title || 'Libro';
  const ownerId = Number(book.user_id || book.ownerId);
  const people = new Set();
  if (ownerId) people.add(ownerId);
  if (exchange) {
    if (exchange.solicitante_id) people.add(Number(exchange.solicitante_id));
    if (exchange.receptor_id) people.add(Number(exchange.receptor_id));
  }

  for (const userId of people) {
    if (!userId) continue;
    const esDueno = userId === ownerId;
    try {
      await Notification.createNotification({
        userId,
        tipo: 'libro_retirado',
        titulo: 'Libro retirado',
        mensaje: esDueno
          ? `Tu libro "${title}" fue retirado del estante con éxito.`
          : `Retiraste "${title}" del estante con éxito.`,
        exchangeId: exchange?.id || null,
        bookId: Number(book.id)
      });
    } catch (error) {
      console.warn('Aviso de retiro sin notificación:', error.message);
    }
  }
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

  const [delLibro] = await db.execute(
    'SELECT uid FROM tarjetas_rfid WHERE libro_id = ? LIMIT 1',
    [bookId]
  );
  if (delLibro.length) {
    const error = new Error('Este libro ya tiene una tarjeta vinculada y no se puede cambiar.');
    error.status = 409;
    throw error;
  }

  const [deLaTarjeta] = await db.execute(
    'SELECT libro_id FROM tarjetas_rfid WHERE uid = ? LIMIT 1',
    [uid]
  );
  if (deLaTarjeta.length) {
    const error = new Error('Esa tarjeta ya está vinculada a otro libro.');
    error.status = 409;
    throw error;
  }

  await db.execute(
    'INSERT INTO tarjetas_rfid (uid, libro_id) VALUES (?, ?)',
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

async function notifyEveryone(payload) {
  const [users] = await db.execute('SELECT id FROM usuarios WHERE activo = TRUE');
  await notifyUsers(users.map((user) => user.id), payload);
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
    await notifyEveryone({
      tipo: 'estante_deposito',
      titulo: 'Libro en el estante',
      mensaje: `Se colocó "${title}" en el estante.`,
      exchangeId: exchange?.id || null,
      bookId: resolvedBookId
    });
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
    await notifyRemoval(book, exchange);
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
    await notifyRemoval(book, recent);
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

  await notifyRemoval(book, null);
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
