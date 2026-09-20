import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Book } from '../models/book';

interface BooksResponse {
  success: boolean;
  data: ApiBook[];
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit?: number;
  };
}

interface BookResponse {
  success: boolean;
  data: ApiBook;
}

interface ApiBook {
  id?: number;
  title: string;
  author: string;
  description?: string;
  category?: string;
  category_name?: string;
  categoryName?: string;
  condition?: Book['condition'];
  condition_status?: Book['condition'];
  location?: string;
  imageUrl?: string | null;
  image_url?: string | null;
  ownerId?: number;
  ownerName?: string;
  owner_name?: string;
  status?: 'available' | 'exchanged' | 'reserved';
  createdAt?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private readonly apiUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  getBooks(filters: Record<string, string | number | undefined> = {}): Observable<Book[]> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BooksResponse>(this.apiUrl, { params }).pipe(
      map((response) => response.data.map((book) => this.normalizeBook(book)))
    );
  }

  getBooksByUser(userId: number): Observable<Book[]> {
    return this.http.get<BooksResponse>(`${this.apiUrl}/user/${userId}`).pipe(
      map((response) => response.data.map((book) => this.normalizeBook(book)))
    );
  }

  getBookById(id: string | number): Observable<Book | undefined> {
    return this.http.get<BookResponse>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.normalizeBook(response.data))
    );
  }

  addBook(book: Omit<Book, 'id' | 'createdAt'>, file?: File | null): Observable<Book> {
    const formData = new FormData();
    formData.append('title', book.title);
    formData.append('author', book.author);
    formData.append('description', book.description || '');
    formData.append('category', book.category || 'Otros');
    formData.append('condition', book.condition || 'good');
    formData.append('location', book.location || '');

    if (file) {
      formData.append('image', file, file.name);
    } else if (book.imageUrl) {
      formData.append('image_url', book.imageUrl);
    }

    return this.http.post<BookResponse>(this.apiUrl, formData).pipe(
      map((response) => this.normalizeBook(response.data))
    );
  }

  updateBook(id: string | number, changes: Partial<Book>, file?: File | null): Observable<Book> {
    const formData = new FormData();
    if (changes.title) formData.append('title', changes.title);
    if (changes.author) formData.append('author', changes.author);
    formData.append('description', changes.description || '');
    formData.append('category', changes.category || 'Otros');
    formData.append('condition', changes.condition || 'good');
    formData.append('location', changes.location || '');

    if (file) {
      formData.append('image', file, file.name);
    } else if (changes.imageUrl) {
      formData.append('image_url', changes.imageUrl);
    }

    return this.http.put<BookResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      map((response) => this.normalizeBook(response.data))
    );
  }

  deleteBook(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private normalizeBook(book: ApiBook): Book {
    const imageUrl = this.normalizeAssetUrl(book.imageUrl || book.image_url);

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.categoryName || book.category_name || book.category || 'Sin categoria',
      condition: book.condition || book.condition_status || 'good',
      description: book.description || '',
      location: book.location || '',
      imageUrl,
      ownerId: book.ownerId ? String(book.ownerId) : undefined,
      ownerName: book.ownerName || book.owner_name,
      status: book.status || 'available',
      createdAt: book.createdAt || book.created_at
    };
  }

  private normalizeAssetUrl(url?: string | null): string {
    if (!url) return '';
    if (/^(https?:|data:|assets\/)/.test(url)) return url;
    return url.startsWith('/') ? url : `/${url}`;
  }
}
