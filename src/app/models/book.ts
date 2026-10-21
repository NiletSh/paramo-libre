export interface Book {
  id?: string | number;
  title: string;
  author: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  description: string;
  /** Siempre el estante comunitario; ya no se elige zona en la app. */
  location?: string;
  imageUrl?: string | null;
  ownerId?: string;
  ownerName?: string;
  status?: 'available' | 'exchanged' | 'reserved';
  createdAt?: string;
  rfidUid?: string | null;
}

/** Punto único de entrega física (estante con sensores). */
export const SHELF_LOCATION = 'Estante Páramo Libre';

export const SHELF_INSTRUCTIONS =
  'Cuando el trueque sea aceptado, deposita y recoge los libros en el estante. Los sensores avisarán cuando alguien retire un libro.';

/** Nombres alineados con la tabla `categorias` en MySQL (+ Otros sin fila dedicada). */
export const BOOK_CATEGORIES: string[] = [
  'Novela',
  'Ciencia Ficción',
  'Fantasía',
  'Historia',
  'Ciencia',
  'Tecnología',
  'Filosofía',
  'Arte',
  'Poesía',
  'Biografía',
  'Otros'
];

export const BOOK_CONDITIONS = [
  { value: 'new' as const, label: 'Nuevo' },
  { value: 'like_new' as const, label: 'Como nuevo' },
  { value: 'good' as const, label: 'Buen estado' },
  { value: 'fair' as const, label: 'Aceptable' }
];
