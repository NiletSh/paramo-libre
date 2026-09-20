import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookService } from './../../../services/book';
import { Book, BOOK_CATEGORIES, BOOK_CONDITIONS, QUERETARO_LOCATIONS } from './../../../models/book';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  templateUrl: './book-form.html',
  styleUrls: ['./book-form.scss']
})
export class BookFormComponent implements OnInit {
  bookForm: FormGroup;
  categories = BOOK_CATEGORIES;
  conditions = BOOK_CONDITIONS;
  locations = QUERETARO_LOCATIONS;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  isDragOver = false;
  loading = false;
  isEditMode = false;
  bookId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.bookForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      category: ['', Validators.required],
      condition: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      location: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      image: [null]
    });
  }

  ngOnInit(): void {
    this.bookId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.bookId;

    if (this.bookId) {
      this.loadBookForEdit(this.bookId);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
    }
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.processFile(file);
    } else if (file) {
      this.snackBar.open('Por favor, selecciona solo archivos de imagen.', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-warning']
      });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  private processFile(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('La imagen no debe superar los 5MB.', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.bookForm.patchValue({ image: this.imagePreview });
    };
    reader.readAsDataURL(file);
  }

  removeImage(event?: Event): void {
    event?.stopPropagation();
    this.imagePreview = null;
    this.selectedFile = null;
    this.bookForm.patchValue({ image: null });
  }

  onSubmit(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      this.snackBar.open('Completa todos los campos requeridos correctamente.', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    this.loading = true;
    const formValue = this.bookForm.value;
    const currentUser = this.authService.getCurrentUser();
    const bookData: Omit<Book, 'id' | 'createdAt'> = {
      title: formValue.title,
      author: formValue.author,
      category: formValue.category,
      condition: formValue.condition,
      description: formValue.description,
      location: formValue.location,
      imageUrl: formValue.image,
      ownerId: currentUser ? String(currentUser.id) : undefined
    };

    const save$ = this.isEditMode && this.bookId
      ? this.bookService.updateBook(this.bookId, bookData, this.selectedFile)
      : this.bookService.addBook(bookData, this.selectedFile);

    save$.subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open(this.isEditMode ? 'Libro actualizado correctamente.' : 'Libro publicado correctamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/catalogo']);
      },
      error: (error) => {
        this.loading = false;
        const message = error?.error?.message || (this.isEditMode ? 'No fue posible actualizar el libro' : 'No fue posible publicar el libro');
        this.snackBar.open(message, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  private loadBookForEdit(id: string): void {
    this.loading = true;
    this.bookService.getBookById(id).subscribe({
      next: (book) => {
        if (!book) {
          this.handleMissingBook();
          return;
        }

        const currentUser = this.authService.getCurrentUser();
        if (book.ownerId && currentUser && Number(book.ownerId) !== currentUser.id && currentUser.rol !== 'admin') {
          this.snackBar.open('No puedes editar un libro que no te pertenece.', 'Cerrar', {
            duration: 4000,
            panelClass: ['snackbar-error']
          });
          this.router.navigate(['/catalogo']);
          return;
        }

        this.bookForm.patchValue({
          title: book.title,
          author: book.author,
          category: book.category,
          condition: book.condition,
          description: book.description,
          location: book.location,
          image: book.imageUrl || null
        });
        this.imagePreview = book.imageUrl || null;
        this.loading = false;
      },
      error: () => this.handleMissingBook()
    });
  }

  private handleMissingBook(): void {
    this.loading = false;
    this.snackBar.open('Libro no encontrado.', 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
    this.router.navigate(['/catalogo']);
  }
}
