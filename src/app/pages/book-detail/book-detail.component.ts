import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BookService } from '../../services/book';
import { AuthService } from '../../core/services/auth.service';
import { Book } from '../../models/book';

interface BookDetail {
  id: string | number;
  ownerId?: string;
  title: string;
  author: string;
  description: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  location: string;
  owner: string;
  ownerAvatar?: string;
  status: 'available' | 'exchanged' | 'reserved';
  publishedDate: string;
  imageColor: string;
  imageUrl: string;
}

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.scss'
})
export class BookDetailComponent implements OnInit {
  book: BookDetail | null = null;
  notFound = false;
  isLoggedIn = false;
  canEditBook = false;

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
    available: 'Disponible para trueque',
    exchanged: 'Ya fue intercambiado',
    reserved: 'Reservado temporalmente'
  };

  statusColors: Record<string, string> = {
    available: '#2d6a4f',
    exchanged: '#868e96',
    reserved: '#e76f51'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.notFound = true;
      return;
    }

    this.bookService.getBookById(idParam).subscribe({
      next: (book) => {
        if (!book) {
          this.notFound = true;
          return;
        }

        this.book = this.toBookDetail(book);
        this.canEditBook = this.canEdit(this.book);
        this.notFound = false;
      },
      error: () => {
        this.notFound = true;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/catalogo']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: `intercambio/${this.book?.id}`,
        reason: 'Debes iniciar sesión para proponer un trueque.'
      }
    });
  }

  private toBookDetail(book: Book): BookDetail {
    return {
      id: book.id || '',
      ownerId: book.ownerId,
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      condition: book.condition,
      location: this.normalizeLocation(book.location),
      owner: book.ownerName || 'Usuario',
      status: book.status || 'available',
      publishedDate: this.formatDate(book.createdAt),
      imageColor: '#0d7377',
      imageUrl: book.imageUrl || 'assets/images/hero-books.svg'
    };
  }

  private formatDate(value?: string): string {
    if (!value) return 'Fecha no disponible';

    return new Date(value).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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

  private canEdit(book: BookDetail): boolean {
    const user = this.authService.getCurrentUser();
    return !!user && (!!book.ownerId && Number(book.ownerId) === user.id || user.rol === 'admin');
  }
}
