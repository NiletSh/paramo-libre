export class Book {
  id?: number;
  title: string;
  author: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  imageUrl?: string;
  location?: string;
  ownerId?: number;
  ownerName?: string;
  status: 'available' | 'exchanged' | 'reserved';
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data?: Partial<Book>) {
    this.id = data?.id;
    this.title = data?.title || '';
    this.author = data?.author || '';
    this.description = data?.description;
    this.categoryId = data?.categoryId;
    this.categoryName = data?.categoryName;
    this.condition = data?.condition || 'good';
    this.imageUrl = data?.imageUrl;
    this.location = data?.location;
    this.ownerId = data?.ownerId;
    this.ownerName = data?.ownerName;
    this.status = data?.status || 'available';
    this.createdAt = data?.createdAt;
    this.updatedAt = data?.updatedAt;
  }
}