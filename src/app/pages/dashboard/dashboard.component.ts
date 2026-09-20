import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { DashboardActivity, DashboardBook, DashboardService } from '../../services/dashboard.service';
import { BookService } from '../../services/book';
import { Book } from '../../models/book';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  userName = 'Lector';
  loading = true;

  stats = [
    { label: 'Propuestas', value: 0, icon: 'outgoing_mail', tone: 'green', link: '/mis-propuestas' },
    { label: 'Solicitudes', value: 0, icon: 'mark_email_unread', tone: 'gold', link: '/mis-propuestas' },
    { label: 'Trueques realizados', value: 0, icon: 'published_with_changes', tone: 'forest', link: '/mis-propuestas' },
    { label: 'Libros publicados', value: 0, icon: 'library_books', tone: 'leaf', link: '/catalogo' }
  ];

  recentBooks: Array<DashboardBook & { cover: string }> = [];
  activities: DashboardActivity[] = [];

  quickActions = [
    { label: 'Publicar libro', description: 'Agrega un titulo disponible', icon: 'add_circle', link: '/publicar-libro', tone: 'publish' },
    { label: 'Explorar catalogo', description: 'Encuentra tu siguiente lectura', icon: 'travel_explore', link: '/catalogo', tone: 'catalog' },
    { label: 'Ver propuestas', description: 'Da seguimiento a tus trueques', icon: 'swap_horiz', link: '/mis-propuestas', tone: 'proposals' },
    { label: 'Editar perfil', description: 'Actualiza tus datos', icon: 'manage_accounts', link: '/perfil', tone: 'profile' }
  ];

  constructor(
    private authService: AuthService,
    private perfilService: PerfilService,
    private dashboardService: DashboardService,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.nombre) {
      this.userName = user.nombre.split(' ')[0];
    }

    this.perfilService.getPerfil().subscribe({
      next: (profile) => {
        this.userName = profile.nombre?.split(' ')[0] || 'Lector';
        this.loadMyBooks(profile.id);
      },
      error: () => {
        if (user?.id) {
          this.loadMyBooks(user.id);
        }
      }
    });

    this.loadDashboard();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      available: 'Disponible',
      exchanged: 'Intercambiado',
      reserved: 'Reservado'
    };
    return labels[status] || status;
  }

  private loadDashboard(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.stats = [
          { ...this.stats[0], value: data.stats.propuestas },
          { ...this.stats[1], value: data.stats.solicitudes },
          { ...this.stats[2], value: data.stats.truequesRealizados },
          { ...this.stats[3], value: data.stats.librosPublicados }
        ];
        this.activities = data.activities;
        this.loading = false;
      },
      error: () => {
        this.recentBooks = [];
        this.activities = [];
        this.loading = false;
      }
    });
  }

  private loadMyBooks(userId: number): void {
    this.bookService.getBooksByUser(userId).subscribe({
      next: (books) => {
        this.recentBooks = books.map((book, index) => ({
          ...this.toDashboardBook(book),
          cover: this.getBookCover(this.toDashboardBook(book), index)
        }));
      },
      error: () => {
        this.recentBooks = [];
      }
    });
  }

  private toDashboardBook(book: Book): DashboardBook {
    return {
      id: Number(book.id || 0),
      title: book.title,
      author: book.author,
      status: book.status || 'available',
      imageUrl: book.imageUrl
    };
  }

  private getBookCover(book: DashboardBook, index: number): string {
    if (book.imageUrl) {
      return `url("${book.imageUrl}") center / cover no-repeat`;
    }

    const covers = [
      'linear-gradient(135deg, #2f4f2f 0%, #7bbd2f 100%)',
      'linear-gradient(135deg, #5d8b1f 0%, #d58a14 100%)',
      'linear-gradient(135deg, #233b2d 0%, #6c8c4e 100%)'
    ];
    return covers[index % covers.length];
  }
}
