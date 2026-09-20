export interface Book {
  id?: string | number;
  title: string;
  author: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  description: string;
  location: string;
  imageUrl?: string | null;
  ownerId?: string;
  ownerName?: string;
  status?: 'available' | 'exchanged' | 'reserved';
  createdAt?: string;
}

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

export const QUERETARO_LOCATIONS: string[] = [
  'Santiago de Querétaro',
  'Corregidora',
  'El Marqués',
  'San Juan del Río',
  'Pedro Escobedo',
  'Tequisquiapan',
  'Cadereyta de Montes',
  'Ezequiel Montes',
  'Colón',
  'Amealco de Bonfil',
  'Huimilpan',
  'Tolimán',
  'Pinal de Amoles',
  'Jalpan de Serra',
  'Querétaro Centro',
  'Juriquilla',
  'Jurica',
  'Candiles',
  'Zibatá'
];

export const BOOK_CONDITIONS = [
  { value: 'new' as const, label: 'Nuevo' },
  { value: 'like_new' as const, label: 'Como nuevo' },
  { value: 'good' as const, label: 'Buen estado' },
  { value: 'fair' as const, label: 'Aceptable' }
];
