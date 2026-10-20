import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer" *ngIf="!hideFooter">
      <div class="footer-inner">
        <span class="footer-copy">© 2026 Páramo Libre. Plataforma de intercambio de libros.</span>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      border-top: 1px solid rgba(107, 138, 100, 0.16);
      background: var(--pl-card);
      padding: 18px 48px;
    }

    .footer-inner {
      max-width: 1280px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .footer-copy {
      color: var(--pl-muted);
      font-size: 13px;
      text-align: center;
    }

    @media (max-width: 680px) {
      .footer {
        padding: 16px 24px;
      }
    }
  `]
})
export class FooterComponent {
  hideFooter = false;

  constructor(private router: Router) {
    this.hideFooter = this.shouldHide(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.hideFooter = this.shouldHide(event.urlAfterRedirects);
      });
  }

  private shouldHide(url: string): boolean {
    const path = url.split('?')[0];
    return path === '/' || path.startsWith('/auth')
      || path.startsWith('/publicar')
      || path.startsWith('/propuestas')
      || path.startsWith('/mis-propuestas')
      || path.endsWith('/editar')
      || /^\/libro\/[^/]+$/.test(path);
  }
}
