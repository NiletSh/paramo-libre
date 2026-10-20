import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { AppNotification, DashboardService } from '../../services/dashboard.service';
import { ShelfLiveService } from '../../services/shelf-live.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" [class.home-bar]="isHomePage" [class.has-user]="isLoggedIn">
      <div class="navbar-inner">
        <a class="navbar-brand" routerLink="/" (click)="closeMenu()">
          <img class="brand-logo" src="assets/images/logo_paramo.png" alt="Páramo Libre" />
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

        <div class="nav-alerts" *ngIf="isLoggedIn" (click)="$event.stopPropagation()">
          <button type="button" class="alert-button" (click)="toggleAlerts()" aria-label="Notificaciones">
            <span class="material-icons">notifications</span>
            <span class="alert-count" *ngIf="unreadCount">{{ unreadCount }}</span>
          </button>
          <div class="alert-panel" *ngIf="alertsOpen">
            <strong>Notificaciones</strong>
            <p class="alert-empty" *ngIf="!notifications.length">No hay avisos todavía.</p>
            <button type="button" class="alert-item" *ngFor="let item of notifications">
              <b>{{ item.titulo || 'Aviso' }}</b>
              <span>{{ item.mensaje }}</span>
            </button>
          </div>
        </div>

        <a class="nav-avatar" *ngIf="isLoggedIn" routerLink="/perfil" (click)="closeMenu()" [attr.aria-label]="'Perfil de ' + userName">
          <img *ngIf="photoUrl && !photoFailed" [src]="photoUrl" alt="" (error)="photoFailed = true">
          <span *ngIf="!photoUrl || photoFailed">{{ initials }}</span>
        </a>

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

    .navbar.has-user .navbar-inner {
      padding-right: 118px;
    }

    .nav-alerts {
      position: absolute;
      top: 16px;
      right: 58px;
      z-index: 2;
    }

    .alert-button {
      position: relative;
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      color: #2f4f2f;
      cursor: pointer;
      box-shadow: 0 0 0 1px rgba(93, 139, 31, 0.18);
    }

    .alert-button .material-icons {
      font-size: 22px;
    }

    .alert-count {
      position: absolute;
      top: -2px;
      right: -2px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 999px;
      background: #c64b3d;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      line-height: 18px;
    }

    .alert-panel {
      position: absolute;
      top: 48px;
      right: 0;
      width: min(320px, calc(100vw - 24px));
      max-height: 360px;
      overflow: auto;
      padding: 12px;
      border-radius: 16px;
      background: #ffffff;
      border: 1px solid rgba(123, 189, 47, 0.2);
      box-shadow: 0 16px 40px rgba(47, 79, 47, 0.16);
    }

    .alert-panel strong {
      display: block;
      margin-bottom: 8px;
      color: #2f4f2f;
    }

    .alert-empty {
      margin: 0;
      color: #6a7d3b;
      font-size: 14px;
    }

    .alert-item {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      margin-top: 8px;
      padding: 10px;
      border: 0;
      border-radius: 12px;
      background: #f7f6f1;
      text-align: left;
      cursor: default;
    }

    .alert-item b {
      color: #2f4f2f;
      font-size: 13px;
    }

    .alert-item span {
      color: #4b5d32;
      font-size: 13px;
      line-height: 1.4;
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
      height: 64px;
      width: auto;
      display: block;
      object-fit: contain;
    }

    .home-bar {
      background: transparent;
    }

    .home-bar .nav-link {
      color: #2c3328;
    }

    .home-bar .nav-link:hover,
    .home-bar .nav-link.active {
      color: #6e4524;
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

    .nav-avatar {
      position: absolute;
      top: 15px;
      right: 8px;
      width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 2px rgba(93, 139, 31, 0.45);
      background: linear-gradient(135deg, #7bbd2f 0%, #5d8b1f 100%);
      color: #ffffff;
      font-size: 14px;
      font-weight: 800;
      text-decoration: none;
    }

    .nav-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
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

      .navbar.has-user .navbar-inner {
        padding-right: 156px;
      }

      .menu-toggle {
        display: flex;
      }

      .navbar.has-user .menu-toggle {
        position: absolute;
        top: 16px;
        right: 108px;
      }
    }

    @media (max-width: 720px) {
      .brand-logo {
        height: 46px;
        max-width: 42vw;
      }

      .navbar-inner {
        gap: 8px;
      }
    }

    @media (max-width: 460px) {
      .navbar-inner {
        padding: 0 12px;
      }
    }
  `]
})
export class NavbarComponent implements OnDestroy {
  menuOpen = false;
  isLoggedIn = false;
  isHomePage = true;
  userName = 'Perfil';
  photoUrl = '';
  initials = 'P';
  photoFailed = false;
  alertsOpen = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  private profileLoaded = false;
  private alertTimer?: ReturnType<typeof setInterval>;
  private alertSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private shelfLive: ShelfLiveService
  ) {
    this.authService.currentUser$.subscribe((user) => this.applyUser(user));

    this.authService.isAuthenticated$.subscribe((status) => {
      this.isLoggedIn = status;
      this.menuOpen = false;
      if (!status) {
        this.profileLoaded = false;
        this.stopAlerts();
        return;
      }
      this.startAlerts();
      if (this.profileLoaded) return;
      this.profileLoaded = true;
      this.authService.loadProfile().subscribe({
        error: () => {
          this.profileLoaded = false;
        }
      });
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

  ngOnDestroy(): void {
    this.stopAlerts();
  }

  @HostListener('document:click')
  closeAlerts(): void {
    this.alertsOpen = false;
  }

  toggleAlerts(): void {
    this.alertsOpen = !this.alertsOpen;
    if (!this.alertsOpen || !this.unreadCount) return;
    this.dashboardService.markNotificationsRead().subscribe({
      next: () => {
        this.unreadCount = 0;
        this.notifications = this.notifications.map((item) => ({ ...item, leida: true }));
      }
    });
  }

  private startAlerts(): void {
    this.loadAlerts();
    if (this.alertTimer) return;
    this.alertTimer = setInterval(() => this.loadAlerts(), 20000);
    this.alertSub = this.shelfLive.events$.subscribe(() => this.loadAlerts());
  }

  private stopAlerts(): void {
    if (this.alertTimer) clearInterval(this.alertTimer);
    this.alertTimer = undefined;
    this.alertSub?.unsubscribe();
    this.alertSub = undefined;
    this.alertsOpen = false;
    this.notifications = [];
    this.unreadCount = 0;
  }

  private loadAlerts(): void {
    this.dashboardService.getNotifications().subscribe({
      next: (items) => {
        this.notifications = items;
        this.unreadCount = items.filter((item) => item.leida === false).length;
      }
    });
  }

  private applyUser(user: AuthUser | null): void {
    this.photoFailed = false;
    if (!user) {
      this.userName = 'Perfil';
      this.photoUrl = '';
      this.initials = 'P';
      return;
    }

    this.userName = user.nombre?.trim() || 'Perfil';
    this.photoUrl = user.foto_perfil || '';
    const parts = this.userName.split(/\s+/).filter(Boolean);
    this.initials = parts.slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'P';
  }
}
