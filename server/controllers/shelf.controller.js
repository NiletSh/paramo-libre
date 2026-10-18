const Book = require('../models/book.model');
const db = require('../config/db');
const Notification = require('../services/notification.service');
const { SHELF_LOCATION, SHELF_REMOVED_MESSAGE } = require('../constants/shelf');

function authorizeShelf(req, res) {
  const expected = process.env.SHELF_API_KEY;
  if (!expected) {
    console.warn('SHELF_API_KEY no configurada: eventos de estante rechazados.');
    res.status(503).json({ message: 'Sensor de estante no configurado en el servidor' });
    return false;
  }
  const key = req.headers['x-shelf-key'];
  if (key !== expected) {
    res.status(401).json({ message: 'Clave de estante inválida' });
    return false;
  }
  return true;
}

async function findActiveExchangeForBook(bookId) {
  const [rows] = await db.execute(
    `SELECT i.id, i.solicitante_id, i.receptor_id, i.libro_solicitado_id, i.libro_ofrecido_id
     FROM intercambios i
     WHERE i.activo = TRUE
       AND i.estado = 'aceptado'
       AND (i.libro_solicitado_id = ? OR i.libro_ofrecido_id = ?)
     ORDER BY i.fecha_respuesta DESC
     LIMIT 1`,
    [bookId, bookId]
  );
  return rows[0] || null;
}

exports.handleWeightEvent = async (req, res) => {
  try {
    if (!authorizeShelf(req, res)) return;

    const bookId = Number(req.body.book_id || req.body.bookId);
    const event = String(req.body.event || 'removed').toLowerCase();

    if (!bookId) {
      return res.status(400).json({ message: 'book_id es obligatorio' });
    }

    if (!['removed', 'placed'].includes(event)) {
      return res.status(400).json({ message: 'event debe ser "removed" o "placed"' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const exchange = await findActiveExchangeForBook(bookId);
    const title = book.title || book.titulo || 'Libro';

    let notifiedUsers = 0;

    if (event === 'removed') {
      try {
        await Notification.createNotification({
          userId: book.user_id,
          tipo: 'estante_retiro',
          titulo: 'Libro retirado del estante',
          mensaje: SHELF_REMOVED_MESSAGE(title),
          exchangeId: exchange?.id,
          bookId
        });
        notifiedUsers += 1;

        if (exchange) {
          const otherUserId =
            exchange.solicitante_id === book.user_id
              ? exchange.receptor_id
              : exchange.solicitante_id;

          await Notification.createNotification({
            userId: otherUserId,
            tipo: 'estante_retiro_par',
            titulo: 'Retiro detectado en el trueque',
            mensaje: `"${title}" salió del ${SHELF_LOCATION}. Si te corresponde, ya puedes recoger tu libro del estante.`,
            exchangeId: exchange.id,
            bookId
          });
          notifiedUsers += 1;
        }
      } catch (notificationError) {
        console.warn('Evento de estante registrado sin notificación:', notificationError.message);
      }

      return res.json({
        message: 'Evento de retiro registrado',
        book_id: bookId,
        notified_users: notifiedUsers
      });
    }

    try {
      await Notification.createNotification({
        userId: book.user_id,
        tipo: 'estante_deposito',
        titulo: 'Libro depositado en el estante',
        mensaje: `El sensor confirmó que "${title}" está en el ${SHELF_LOCATION}.`,
        exchangeId: exchange?.id,
        bookId
      });
      notifiedUsers = 1;
    } catch (notificationError) {
      console.warn('Depósito en estante sin notificación:', notificationError.message);
    }

    res.json({
      message: 'Evento de depósito registrado',
      book_id: bookId,
      notified_users: notifiedUsers
    });
  } catch (error) {
    console.error('Error en evento de estante:', error);
    res.status(500).json({ message: 'Error al procesar el evento del estante' });
  }
};
