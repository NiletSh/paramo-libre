import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: state.url.replace(/^\//, ''),
        reason: this.getReasonMessage(state.url)
      }
    });
    return false;
  }

  private getReasonMessage(url: string): string {
    if (url.includes('publicar-libro') || url.includes('publicar')) {
      return 'Debes iniciar sesion para publicar un libro.';
    }
    if (url.includes('mis-propuestas') || url.includes('propuestas')) {
      return 'Debes iniciar sesion para ver tus propuestas.';
    }
    if (url.includes('dashboard') || url.includes('mi-espacio')) {
      return 'Debes iniciar sesion para acceder a Mi espacio.';
    }
    if (url.includes('perfil')) {
      return 'Debes iniciar sesion para editar tu perfil.';
    }
    if (url.includes('intercambio')) {
      return 'Debes iniciar sesion para proponer un trueque.';
    }

    return 'Debes iniciar sesion para continuar.';
  }
}
