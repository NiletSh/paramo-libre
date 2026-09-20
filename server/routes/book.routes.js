const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const upload = require('../middlewares/upload');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', bookController.getAllBooks);
router.get('/user/:user_id', bookController.getBooksByUser);
router.get('/:id', bookController.getBookById);
router.post('/', authenticate, upload.single('image'), bookController.createBook);
router.put('/:id', authenticate, upload.single('image'), bookController.updateBook);
router.delete('/:id', authenticate, bookController.deleteBook);

module.exports = router;
