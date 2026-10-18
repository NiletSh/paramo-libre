const express = require('express');
const shelfController = require('../controllers/shelf.controller');

const router = express.Router();

/** Webhook para Arduino / sensores de peso del estante */
router.post('/events', shelfController.handleWeightEvent);

module.exports = router;
