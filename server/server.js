require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas adaptadas a los nombres de tus archivos
app.use('/api/users', require('./routes/usuarioRoutes'));
app.use('/api/books', require('./routes/book.routes'));
app.use('/api/exchanges', require('./routes/exchange.routes'));
app.use('/api', require('./routes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Páramo Libre funcionando correctamente' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
