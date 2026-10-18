import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" [class.home-bar]="isHomePage">
      <div class="navbar-inner">
        <a class="navbar-brand" routerLink="/" (click)="closeMenu()">
          <img class="brand-logo" src="assets/images/logo_paramo.png" alt="" />
          <span class="brand-name">P&aacute;ramo Libre</span>
        </a>

        <div class="nav-links" *ngIf="isLoggedIn || !isHomePage">
          <ng-container *ngIf="isLoggedIn; else publicLinks">
            <a class="nav-link" routerLink="/catalogo" routerLinkActive="active">Cat&aacute;logo</a>
            <a class="nav-link" routerLink="/publicar-libro" routerLinkActive="active">Publicar libro</a>
            <a class="nav-link" routerLink="/mis-propuestas" routerLinkActive="active">Propuestas</a>
            <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Mi espacio</a>
            <a class="nav-link" routerLink="/perfil" routerLinkActive="active">Perfil</a>
          </ng-container>

          <ng-template #publicLinks>
            <a class="nav-link" routerLink="/auth/login" routerLinkActive="active">Iniciar sesi&oacute;n</a>
            <a class="nav-link nav-link-register" routerLink="/auth/registro" routerLinkActive="active">Registrarse</a>
          </ng-template>
        </div>

        <button class="menu-toggle" *ngIf="isLoggedIn || !isHomePage" type="button" (click)="toggleMenu()" [class.active]="menuOpen" aria-label="Men&uacute;">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div class="mobile-menu" [class.open]="menuOpen" *ngIf="isLoggedIn || !isHomePage">
        <ng-container *ngIf="isLoggedIn; else publicMobileLinks">
          <a class="mobile-link" routerLink="/catalogo" (click)="closeMenu()" routerLinkActive="active">Cat&aacute;logo</a>
          <a class="mobile-link" routerLink="/publicar-libro" (click)="closeMenu()" routerLinkActive="active">Publicar libro</a>
          <a class="mobile-link" routerLink="/mis-propuestas" (click)="closeMenu()" routerLinkActive="active">Propuestas</a>
          <a class="mobile-link" routerLink="/dashboard" (click)="closeMenu()" routerLinkActive="active">Mi espacio</a>
          <a class="mobile-link" routerLink="/perfil" (click)="closeMenu()" routerLinkActive="active">Perfil</a>
        </ng-container>

        <ng-template #publicMobileLinks>
          <a class="mobile-link" routerLink="/auth/login" (click)="closeMenu()" routerLinkActive="active">Iniciar sesi&oacute;n</a>
          <a class="mobile-link mobile-register" routerLink="/auth/registro" (click)="closeMenu()" routerLinkActive="active">Registrarse</a>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(247, 246, 241, 0.94);
      backdrop-filter: blur(10px);
    }

    .navbar-inner {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 0 20px 0 12px;
    }

    .navbar-brand {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #2f4f2f;
      font-weight: 700;
      text-decoration: none;
    }

    .brand-logo {
      height: 56px;
      width: auto;
      display: block;
      object-fit: contain;
    }

    .brand-name {
      color: #2c3328;
      font-size: 18px;
      font-weight: 800;
      white-space: nowrap;
    }

    .home-bar {
      background: transparent;
    }

    .home-bar .brand-name,
    .home-bar .nav-link {
      color: #f6f1e8;
    }

    .home-bar .nav-link:hover,
    .home-bar .nav-link.active {
      color: #e7c27a;
      background: transparent;
    }

    .nav-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex: 1;
    }

    .nav-link {
      padding: 8px 12px;
      border-radius: 999px;
      color: #4d5d3a;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
      white-space: nowrap;
    }

    .nav-link:hover,
    .nav-link.active {
      color: #5d8b1f;
      background: rgba(128, 199, 64, 0.12);
    }

    .nav-link-register,
    .mobile-register {
      color: #ffffff !important;
      background: linear-gradient(135deg, #7bbd2f 0%, #5d8b1f 100%) !important;
      box-shadow: 0 8px 20px rgba(93, 139, 31, 0.16);
    }

    .menu-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      padding: 8px;
      border: 0;
      background: transparent;
      cursor: pointer;
    }

    .menu-toggle span {
      width: 22px;
      height: 2px;
      display: block;
      border-radius: 2px;
      background: #2f4f2f;
    }

    .mobile-menu {
      display: none;
      flex-direction: column;
      gap: 6px;
      padding: 14px 24px 24px;
      border-top: 1px solid rgba(123, 189, 47, 0.16);
      background: #ffffff;
    }

    .mobile-menu.open {
      display: flex;
    }

    .mobile-link {
      padding: 11px 12px;
      border-radius: 8px;
      color: #4d5d3a;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
    }

    .mobile-link.active,
    .mobile-link:hover {
      color: #5d8b1f;
      background: rgba(128, 199, 64, 0.12);
    }

    @media (max-width: 1080px) {
      .nav-links {
        display: none;
      }

      .menu-toggle {
        display: flex;
      }
    }

    @media (max-width: 460px) {
      .navbar-inner {
        padding: 0 16px;
      }
    }
  `]
})
export class NavbarComponent {
  menuOpen = false;
  isLoggedIn = false;
  isHomePage = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.isAuthenticated$.subscribe((status) => {
      this.isLoggedIn = status;
      this.menuOpen = false;
    });

    this.isHomePage = this.router.url === '/';
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isHomePage = event.urlAfterRedirects === '/';
        this.menuOpen = false;
      });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}
