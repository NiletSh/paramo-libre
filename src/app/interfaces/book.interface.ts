export interface IBook {
  id: number;
  title: string;
  author: string;
  description: string;
  categoryId: number;
  categoryName: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  imageUrl: string;
  location: string;
  ownerId: number;
  ownerName: string;
  status: 'available' | 'exchanged' | 'reserved';
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}