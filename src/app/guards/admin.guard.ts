import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const currentUser = this.authService.getCurrentUser() as any;
    const isAdmin = currentUser?.rol === 'admin' || currentUser?.role === 'admin';

    if (isAdmin) {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
