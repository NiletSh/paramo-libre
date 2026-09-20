const Exchange = require('../models/exchange.model');
const Book = require('../models/book.model');

exports.createExchange = async (req, res) => {
  try {
    const { book_id, offered_book_id, message } = req.body;
    const requester_id = req.userId;

    if (!book_id || !offered_book_id) {
      return res.status(400).json({ message: 'El libro solicitado y el libro ofrecido son obligatorios' });
    }

    const book = await Book.findById(book_id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    if (book.user_id === requester_id) {
      return res.status(400).json({ message: 'No puedes intercambiar tu propio libro' });
    }

    if (book.status !== 'available') {
      return res.status(400).json({ message: 'El libro solicitado no esta disponible para intercambio' });
    }

    const owner_id = book.user_id;

    if (offered_book_id) {
      const offeredBook = await Book.findById(offered_book_id);
      if (!offeredBook) {
        return res.status(404).json({ message: 'El libro ofrecido no existe' });
      }
      if (offeredBook.user_id !== requester_id) {
        return res.status(403).json({ message: 'El libro ofrecido no te pertenece' });
      }
      if (offeredBook.status !== 'available') {
        return res.status(400).json({ message: 'El libro ofrecido no esta disponible para intercambio' });
      }
    }

    const exchangeId = await Exchange.create({
      requester_id,
      owner_id,
      book_id,
      offered_book_id,
      message
    });

    const exchange = await Exchange.findById(exchangeId);
    res.status(201).json({ message: 'Propuesta enviada exitosamente', exchange });
  } catch (error) {
    console.error('Error al crear intercambio:', error);
    res.status(500).json({ message: 'Error al enviar la propuesta de intercambio' });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const exchanges = await Exchange.findByRequesterId(req.userId);
    res.json(exchanges);
  } catch (error) {
    console.error('Error al obtener solicitudes enviadas:', error);
    res.status(500).json({ message: 'Error al obtener las solicitudes enviadas' });
  }
};

exports.getReceivedRequests = async (req, res) => {
  try {
    const exchanges = await Exchange.findByOwnerId(req.userId);
    res.json(exchanges);
  } catch (error) {
    console.error('Error al obtener solicitudes recibidas:', error);
    res.status(500).json({ message: 'Error al obtener las solicitudes recibidas' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const exchanges = await Exchange.findHistoryByUserId(req.userId);
    res.json(exchanges);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener el historial' });
  }
};

exports.getExchangeById = async (req, res) => {
  try {
    const { id } = req.params;
    const exchange = await Exchange.findById(id);

    if (!exchange) {
      return res.status(404).json({ message: 'Intercambio no encontrado' });
    }

    if (exchange.requester_id !== req.userId && exchange.owner_id !== req.userId) {
      return res.status(403).json({ message: 'No tienes permiso para ver este intercambio' });
    }

    res.json(exchange);
  } catch (error) {
    console.error('Error al obtener intercambio:', error);
    res.status(500).json({ message: 'Error al obtener el intercambio' });
  }
};

exports.acceptExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const exchange = await Exchange.findById(id);

    if (!exchange) {
      return res.status(404).json({ message: 'Intercambio no encontrado' });
    }

    if (exchange.owner_id !== req.userId) {
      return res.status(403).json({ message: 'Solo el dueño del libro puede aceptar' });
    }

    if (exchange.status !== 'pending') {
      return res.status(400).json({ message: 'Solo se pueden aceptar propuestas pendientes' });
    }

    await Exchange.updateStatus(id, 'accepted');
    await Book.updateStatus(exchange.book_id, 'reserved');
    await Book.updateStatus(exchange.offered_book_id, 'reserved');
    const updated = await Exchange.findById(id);
    res.json({ message: 'Intercambio aceptado', exchange: updated });
  } catch (error) {
    console.error('Error al aceptar intercambio:', error);
    res.status(500).json({ message: 'Error al aceptar el intercambio' });
  }
};

exports.rejectExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const exchange = await Exchange.findById(id);

    if (!exchange) {
      return res.status(404).json({ message: 'Intercambio no encontrado' });
    }

    if (exchange.owner_id !== req.userId) {
      return res.status(403).json({ message: 'Solo el dueño del libro puede rechazar' });
    }

    if (exchange.status !== 'pending') {
      return res.status(400).json({ message: 'Solo se pueden rechazar propuestas pendientes' });
    }

    await Exchange.updateStatus(id, 'rejected');
    const updated = await Exchange.findById(id);
    res.json({ message: 'Intercambio rechazado', exchange: updated });
  } catch (error) {
    console.error('Error al rechazar intercambio:', error);
    res.status(500).json({ message: 'Error al rechazar el intercambio' });
  }
};

exports.cancelExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const exchange = await Exchange.findById(id);

    if (!exchange) {
      return res.status(404).json({ message: 'Intercambio no encontrado' });
    }

    if (exchange.requester_id !== req.userId && exchange.owner_id !== req.userId) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar' });
    }

    if (!['pending', 'accepted'].includes(exchange.status)) {
      return res.status(400).json({ message: 'No se puede cancelar este intercambio' });
    }

    await Exchange.updateStatus(id, 'cancelled');
    if (exchange.status === 'accepted') {
      await Book.updateStatus(exchange.book_id, 'available');
      await Book.updateStatus(exchange.offered_book_id, 'available');
    }
    const updated = await Exchange.findById(id);
    res.json({ message: 'Intercambio cancelado', exchange: updated });
  } catch (error) {
    console.error('Error al cancelar intercambio:', error);
    res.status(500).json({ message: 'Error al cancelar el intercambio' });
  }
};

exports.completeExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const exchange = await Exchange.findById(id);

    if (!exchange) {
      return res.status(404).json({ message: 'Intercambio no encontrado' });
    }

    if (exchange.requester_id !== req.userId && exchange.owner_id !== req.userId) {
      return res.status(403).json({ message: 'No tienes permiso para completar' });
    }

    if (exchange.status !== 'accepted') {
      return res.status(400).json({ message: 'Solo se pueden completar intercambios aceptados' });
    }

    await Exchange.updateStatus(id, 'completed');
    await Book.updateStatus(exchange.book_id, 'exchanged');
    await Book.updateStatus(exchange.offered_book_id, 'exchanged');
    const updated = await Exchange.findById(id);
    res.json({ message: 'Intercambio completado', exchange: updated });
  } catch (error) {
    console.error('Error al completar intercambio:', error);
    res.status(500).json({ message: 'Error al completar el intercambio' });
  }
};
