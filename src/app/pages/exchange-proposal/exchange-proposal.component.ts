import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExchangeService } from '../../services/exchange.service';
import { BookService } from '../../services/book';
import { ExchangeProposalRequest } from '../../models/exchange.model';
import { AuthService } from '../../core/services/auth.service';

interface Book {
  id: number;
  title: string;
  author: string;
  imageUrl: string;
  ownerId: number;
  ownerName: string;
  category: string;
  condition: string;
}

@Component({
  selector: 'app-exchange-proposal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './exchange-proposal.component.html',
  styleUrls: ['./exchange-proposal.component.scss']
})
export class ExchangeProposalComponent implements OnInit {
  bookId!: number;
  requestedBook: Book | null = null;
  myBooks: Book[] = [];
  selectedBookId: number | null = null;
  proposalForm: FormGroup;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private exchangeService: ExchangeService,
    private bookService: BookService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.proposalForm = this.fb.group({
      message: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.bookId = Number(this.route.snapshot.paramMap.get('bookId'));
    this.loadRequestedBook();
    this.loadMyBooks(currentUser.id);
  }

  selectMyBook(bookId: number): void {
    this.selectedBookId = bookId;
  }

  isSelected(bookId: number): boolean {
    return this.selectedBookId === bookId;
  }

  onSubmit(): void {
    if (!this.selectedBookId || !this.requestedBook) {
      this.snackBar.open('Debes seleccionar uno de tus libros para ofrecer.', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    const request: ExchangeProposalRequest = {
      requestedBookId: this.requestedBook.id,
      offeredBookId: this.selectedBookId,
      message: this.proposalForm.value.message
    };

    this.exchangeService.createProposal(request).subscribe({
      next: () => {
        this.submitted = true;
        this.snackBar.open('Propuesta enviada correctamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        setTimeout(() => this.router.navigate(['/mis-propuestas']), 1200);
      },
      error: (error) => {
        const message = error?.error?.message || 'Error al enviar la propuesta';
        this.snackBar.open(message, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/libro', this.bookId]);
  }

  private loadRequestedBook(): void {
    this.bookService.getBookById(this.bookId).subscribe({
      next: (book) => {
        if (!book) {
          this.handleMissingBook();
          return;
        }

        this.requestedBook = {
          id: Number(book.id),
          title: book.title,
          author: book.author,
          imageUrl: book.imageUrl || 'assets/images/hero-books.svg',
          ownerId: Number(book.ownerId || 0),
          ownerName: book.ownerName || 'Usuario',
          category: book.category,
          condition: book.condition
        };
      },
      error: () => this.handleMissingBook()
    });
  }

  private loadMyBooks(userId?: number): void {
    if (!userId) {
      this.myBooks = [];
      return;
    }
    this.bookService.getBooksByUser(userId).subscribe({
      next: (books) => {
        this.myBooks = books
          .filter((book) => Number(book.id) !== this.bookId && (book.status || 'available') === 'available')
          .map((book) => ({
            id: Number(book.id),
            title: book.title,
            author: book.author,
            imageUrl: book.imageUrl || 'assets/images/hero-books.svg',
            ownerId: Number(book.ownerId || userId),
            ownerName: book.ownerName || 'Yo',
            category: book.category,
            condition: book.condition
          }));
      },
      error: () => {
        this.myBooks = [];
        this.snackBar.open('No fue posible cargar tus libros.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  private handleMissingBook(): void {
    this.snackBar.open('Libro no encontrado.', 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
    this.router.navigate(['/catalogo']);
  }
}
