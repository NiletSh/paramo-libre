const Book = require('../models/book.model');
const { bindCard, handleShelfReading } = require('../services/shelf.service');
const { publishShelf } = require('../services/shelf-socket');

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

exports.handleWeightEvent = async (req, res) => {
  try {
    if (!authorizeShelf(req, res)) return;

    const result = await handleShelfReading({
      bookId: req.body.book_id || req.body.bookId,
      uid: req.body.uid,
      event: req.body.event || 'removed',
      weight: req.body.weight
    });
    publishShelf(result);
    res.json(result);
  } catch (error) {
    console.error('Error en evento de estante:', error);
    res.status(error.status || 500).json({ message: error.message || 'Error al procesar el evento del estante' });
  }
};

exports.bindCard = async (req, res) => {
  try {
    if (!authorizeShelf(req, res)) return;
    const linked = await bindCard(req.body.uid, req.body.book_id || req.body.bookId);
    res.json({ message: 'Tarjeta vinculada', ...linked });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'No se pudo vincular la tarjeta' });
  }
};

exports.linkBookCard = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    if (Number(book.user_id) !== Number(req.userId)) {
      return res.status(403).json({ message: 'Solo quien publicó el libro puede vincular su tarjeta' });
    }
    const linked = await bindCard(req.body.uid, book.id);
    res.json({ message: 'Tarjeta vinculada al libro', ...linked });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'No se pudo vincular la tarjeta' });
  }
};
