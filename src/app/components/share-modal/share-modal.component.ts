import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="share-overlay" (click)="close.emit()" role="presentation">
      <div class="share-dialog" role="dialog" aria-labelledby="share-title" (click)="$event.stopPropagation()">
        <button type="button" class="share-close" (click)="close.emit()" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>

        <h2 id="share-title">Compartir Páramo Libre</h2>
        <p class="share-subtitle">Invita a más lectores a intercambiar libros de forma gratuita.</p>

        <div class="qr-block">
          <img [src]="qrUrl" width="200" height="200" alt="Código QR de Páramo Libre" class="qr-image" />
          <span class="qr-hint">Escanea para visitar la página principal</span>
        </div>

        <div class="share-url">{{ siteUrl }}</div>

        <div class="share-actions">
          <button type="button" class="share-btn share-btn-primary" (click)="copyLink()">
            <mat-icon>{{ copied ? 'check' : 'content_copy' }}</mat-icon>
            {{ copied ? 'Enlace copiado' : 'Copiar enlace' }}
          </button>

          <button type="button" class="share-btn share-btn-secondary" (click)="shareNative()" *ngIf="canShare">
            <mat-icon>share</mat-icon>
            Compartir
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .share-overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(47, 79, 47, 0.45);
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease-out;
    }

    .share-dialog {
      position: relative;
      width: min(420px, 100%);
      padding: 32px 28px 28px;
      border: 1px solid rgba(123, 189, 47, 0.2);
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 24px 60px rgba(47, 79, 47, 0.18);
      text-align: center;
      animation: slideUp 0.25s ease-out;
    }

    .share-close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 50%;
      background: #f3f8e8;
      color: #5d8b1f;
      cursor: pointer;
    }

    h2 {
      margin: 0 0 8px;
      color: #2f4f2f;
      font-size: 22px;
      font-weight: 900;
    }

    .share-subtitle {
      margin: 0 0 24px;
      color: #6a7d3b;
      font-size: 14px;
      line-height: 1.5;
    }

    .qr-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .qr-image {
      border: 1px solid rgba(123, 189, 47, 0.2);
      border-radius: 12px;
      padding: 8px;
      background: #ffffff;
    }

    .qr-hint {
      color: #6a7d3b;
      font-size: 12px;
      font-weight: 700;
    }

    .share-url {
      margin-bottom: 20px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #f8fdea;
      color: #4b5d32;
      font-size: 13px;
      font-weight: 650;
      word-break: break-all;
    }

    .share-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .share-btn {
      min-height: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 850;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .share-btn:hover {
      transform: translateY(-1px);
    }

    .share-btn-primary {
      color: #ffffff;
      background: linear-gradient(135deg, #7bbd2f 0%, #5d8b1f 100%);
      box-shadow: 0 8px 20px rgba(123, 189, 47, 0.24);
    }

    .share-btn-secondary {
      color: #2f4f2f;
      background: #ffffff;
      border: 1px solid rgba(123, 189, 47, 0.22);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ShareModalComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  readonly siteUrl = environment.siteUrl;
  readonly qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(environment.siteUrl)}`;
  readonly canShare = typeof navigator !== 'undefined' && !!navigator.share;

  copied = false;

  constructor(private snackBar: MatSnackBar) {}

  copyLink(): void {
    navigator.clipboard.writeText(this.siteUrl).then(() => {
      this.copied = true;
      this.snackBar.open('Enlace copiado al portapapeles', 'Cerrar', { duration: 2500 });
      setTimeout(() => (this.copied = false), 2000);
    }).catch(() => {
      this.snackBar.open('No se pudo copiar el enlace', 'Cerrar', { duration: 3000 });
    });
  }

  shareNative(): void {
    if (!navigator.share) return;

    navigator.share({
      title: environment.appName,
      text: 'Intercambia libros de forma sencilla y gratuita con Páramo Libre.',
      url: this.siteUrl
    }).catch(() => undefined);
  }
}
