import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { QUERETARO_LOCATIONS } from '../../models/book';

/**
 * Validador personalizado: verifica que dos campos coincidan
 */
export function passwordMatchValidator(matchTo: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;
    const matchControl = parent.get(matchTo);
    if (!matchControl) return null;
    return control.value === matchControl.value ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  locations = QUERETARO_LOCATIONS;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, passwordMatchValidator('password')]],
      location: [''],
      terms: [false, Validators.requiredTrue]
    });

    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.registerForm.get('confirmPassword')?.updateValueAndValidity({ onlySelf: true });
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      const { name, email, password, location } = this.registerForm.value;

      this.authService.register({
        nombre: name,
        email,
        password,
        ubicacion: location
      }).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Cuenta creada correctamente.', 'Cerrar', {
            duration: 4000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          const message =
            error?.status === 0
              ? 'No se pudo conectar con el servidor. Verifica que el backend esté activo.'
              : error?.error?.mensaje || error?.error?.message || 'No fue posible crear la cuenta';
          this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
      this.snackBar.open('Completa todos los campos obligatorios e intenta nuevamente', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-warning']
      });
    }
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get location() { return this.registerForm.get('location'); }
  get terms() { return this.registerForm.get('terms'); }

  /**
   * Calcula la fortaleza de la contraseña (0-3)
   */
  get passwordStrength(): number {
    const value = this.password?.value || '';
    if (value.length === 0) return 0;
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
    return score;
  }

  get strengthLabel(): string {
    const s = this.passwordStrength;
    if (s === 0) return '';
    if (s === 1) return 'Débil';
    if (s === 2) return 'Media';
    return 'Fuerte';
  }

  get strengthColor(): string {
    const s = this.passwordStrength;
    if (s === 1) return '#ff6b6b';
    if (s === 2) return '#e76f51';
    return '#2d6a4f';
  }
}
