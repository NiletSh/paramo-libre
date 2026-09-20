const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchange.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/', authenticate, exchangeController.createExchange);
router.get('/my-requests', authenticate, exchangeController.getMyRequests);
router.get('/received', authenticate, exchangeController.getReceivedRequests);
router.get('/history', authenticate, exchangeController.getHistory);
router.get('/:id', authenticate, exchangeController.getExchangeById);
router.put('/:id/accept', authenticate, exchangeController.acceptExchange);
router.put('/:id/reject', authenticate, exchangeController.rejectExchange);
router.put('/:id/cancel', authenticate, exchangeController.cancelExchange);
router.put('/:id/complete', authenticate, exchangeController.completeExchange);

module.exports = router;