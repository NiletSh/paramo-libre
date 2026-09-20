const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// GET /api/test
router.get('/test', testController.getTest);

// GET /api/test-db  <-- Esta es la ruta que te faltaba
router.get('/test-db', testController.testDatabase);

module.exports = router;