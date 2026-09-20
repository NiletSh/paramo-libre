import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PerfilService } from '../../services/perfil.service';
import { Perfil } from '../../models/perfil.model';
import { QUERETARO_LOCATIONS } from '../../models/book';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private perfilService = inject(PerfilService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  perfil: Perfil | null = null;
  isEditing = false;
  isLoading = false;
  isChangingPassword = false;
  showPasswordForm = false;
  locations = QUERETARO_LOCATIONS;

  perfilForm!: FormGroup;
  passwordForm!: FormGroup;

  selectedFile: File | null = null;
  fotoPreview: string | null = null;

  ngOnInit(): void {
    this.perfilService.getPerfil().subscribe(p => {
      this.perfil = p;
      this.initForms();
    });
  }

  initForms(): void {
    this.perfilForm = this.fb.group({
      nombre: [this.perfil?.nombre || '', [Validators.required, Validators.maxLength(50)]],
      apellido: [this.perfil?.apellido || '', [Validators.maxLength(50)]],
      email: [this.perfil?.email || '', [Validators.required, Validators.email]],
      telefono: [this.perfil?.telefono || ''],
      ubicacion: [this.perfil?.ubicacion || '', Validators.maxLength(100)],
      biografia: [this.perfil?.biografia || '', Validators.maxLength(500)]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.perfil) {
      this.initForms();
      this.selectedFile = null;
      this.fotoPreview = null;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid) return;

    this.isLoading = true;
    const updatedPerfil: Perfil = {
      ...this.perfil!,
      ...this.perfilForm.value
    };

    const saveProfile$ = this.selectedFile && this.fotoPreview
      ? this.perfilService.uploadFoto(this.selectedFile).pipe(
          switchMap((photoUrl) => {
            updatedPerfil.fotoUrl = photoUrl;
            return this.perfilService.updatePerfil(updatedPerfil);
          })
        )
      : this.perfilService.updatePerfil(updatedPerfil);

    saveProfile$.subscribe({
      next: (p) => {
        this.perfil = p;
        this.authService.updateStoredUser({
          id: p.id,
          nombre: p.nombre,
          email: p.email,
          rol: this.authService.getCurrentUser()?.rol || 'usuario',
          ubicacion: p.ubicacion,
          telefono: p.telefono,
          foto_perfil: p.fotoUrl
        });
        this.isEditing = false;
        this.isLoading = false;
        this.selectedFile = null;
        this.fotoPreview = null;
        this.snackBar.open('Perfil actualizado correctamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al actualizar el perfil. Intenta nuevamente.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.snackBar.open('Las contraseñas no coinciden.', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    this.isChangingPassword = true;
    this.perfilService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.showPasswordForm = false;
        this.passwordForm.reset();
        this.snackBar.open('Contraseña actualizada correctamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
      },
      error: () => {
        this.isChangingPassword = false;
        this.snackBar.open('Error al cambiar la contraseña. Verifica los datos e intenta nuevamente.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  getInitials(): string {
    if (!this.perfil) return '';
    const parts = `${this.perfil.nombre || ''} ${this.perfil.apellido || ''}`.trim().split(/\s+/);
    return parts.slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }
}
