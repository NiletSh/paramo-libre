/** Punto único de entrega física (estante con sensores de peso). */
const SHELF_LOCATION = 'Estante Páramo Libre';

const SHELF_ACCEPT_MESSAGE =
  'Trueque aceptado. Lleva tu libro al estante comunitario. Cuando alguien retire un libro, el sensor avisará en la app.';

const SHELF_REMOVED_MESSAGE = (title) =>
  `El sensor detectó que "${title}" fue retirado del estante.`;

module.exports = {
  SHELF_LOCATION,
  SHELF_ACCEPT_MESSAGE,
  SHELF_REMOVED_MESSAGE
};
