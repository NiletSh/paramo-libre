import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BookService } from '../../services/book';
import { AuthService } from '../../core/services/auth.service';
import { Book, BOOK_CATEGORIES, BOOK_CONDITIONS, QUERETARO_LOCATIONS } from '../../models/book';

interface CatalogBook {
  id: string | number;
  title: string;
  author: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  location: string;
  owner: string;
  status: 'available' | 'exchanged' | 'reserved';
  imageColor: string;
  imageUrl?: string | null;
  createdAt?: string;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {
  searchTerm = '';
  selectedCategory = 'Todos';
  selectedCondition = 'Todos';
  selectedLocation = 'Todas';
  sortBy = 'recent';
  currentPage = 1;
  itemsPerPage = 8;
  loading = false;

  categories = ['Todos', ...BOOK_CATEGORIES];
  conditions = [{ value: 'Todos', label: 'Todos los estados' }, ...BOOK_CONDITIONS];
  locations = ['Todas', ...QUERETARO_LOCATIONS];

  conditionLabels: Record<string, string> = {
    new: 'Nuevo',
    like_new: 'Como nuevo',
    good: 'Bueno',
    fair: 'Aceptable'
  };

  conditionColors: Record<string, string> = {
    new: '#2d6a4f',
    like_new: '#0d7377',
    good: '#e76f51',
    fair: '#868e96'
  };

  statusLabels: Record<string, string> = {
    available: 'Disponible',
    exchanged: 'Intercambiado',
    reserved: 'Reservado'
  };

  allBooks: CatalogBook[] = [];
  isLoggedIn = false;

  constructor(
    private bookService: BookService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((status) => {
      this.isLoggedIn = status;
    });
    this.loadBooks();
  }

  get paginatedBooks(): CatalogBook[] {
    const filtered = this.getFilteredBooksSync();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.getFilteredBooksSync().length / this.itemsPerPage);
  }

  get totalResults(): number {
    return this.getFilteredBooksSync().length;
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  applyFilters(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'Todos';
    this.selectedCondition = 'Todos';
    this.selectedLocation = 'Todas';
    this.sortBy = 'recent';
    this.currentPage = 1;
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  private loadBooks(): void {
    this.loading = true;
    this.bookService.getBooks({ limit: 100 }).subscribe({
      next: (books) => {
        this.allBooks = books.map((book, index) => this.toCatalogBook(book, index));
        this.loading = false;
      },
      error: () => {
        this.allBooks = [];
        this.loading = false;
      }
    });
  }

  private getFilteredBooksSync(): CatalogBook[] {
    let result = this.allBooks;

    if (this.selectedCategory !== 'Todos') {
      result = result.filter((book) => this.normalizeText(book.category) === this.normalizeText(this.selectedCategory));
    }

    if (this.selectedCondition !== 'Todos') {
      result = result.filter((book) => book.condition === this.selectedCondition);
    }

    if (this.selectedLocation !== 'Todas') {
      result = result.filter((book) => this.normalizeText(book.location) === this.normalizeText(this.selectedLocation));
    }

    if (this.searchTerm.trim()) {
      const term = this.normalizeText(this.searchTerm);
      result = result.filter((book) =>
        this.normalizeText(book.title).includes(term) ||
        this.normalizeText(book.author).includes(term) ||
        this.normalizeText(book.location).includes(term)
      );
    }

    return [...result].sort((a, b) => {
      if (this.sortBy === 'title') return a.title.localeCompare(b.title, 'es');
      if (this.sortBy === 'location') return a.location.localeCompare(b.location, 'es');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }

  private toCatalogBook(book: Book, index: number): CatalogBook {
    const colors = ['#0d7377', '#7b2cbf', '#e63946', '#2d6a4f', '#e76f51'];

    return {
      id: book.id || index + 1,
      title: book.title,
      author: book.author,
      category: book.category,
      condition: book.condition,
      location: this.normalizeLocation(book.location),
      owner: book.ownerName || 'Usuario',
      status: book.status || 'available',
      imageColor: colors[index % colors.length],
      imageUrl: book.imageUrl,
      createdAt: book.createdAt
    };
  }

  private normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private normalizeLocation(location: string): string {
    const legacyLocations: Record<string, string> = {
      'Bogotá, Colombia': 'Santiago de Querétaro',
      'Medellín, Colombia': 'Corregidora',
      'Cali, Colombia': 'San Juan del Río',
      'Barranquilla, Colombia': 'El Marqués',
      'Cartagena, Colombia': 'Tequisquiapan'
    };

    return legacyLocations[location] || location || 'Sin especificar';
  }
}
