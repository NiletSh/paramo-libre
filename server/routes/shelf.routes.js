const express = require('express');
const shelfController = require('../controllers/shelf.controller');

const router = express.Router();

/** Webhook para el ESP32 del estante */
router.post('/events', shelfController.handleWeightEvent);
router.post('/cards', shelfController.bindCard);

module.exports = router;
