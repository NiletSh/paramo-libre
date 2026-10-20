import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Cargando Páramo Libre...</p>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      gap: 1rem;
    }

    .loading-spinner {
      width: 56px;
      height: 56px;
      border: 4px solid #e9ecef;
      border-top-color: #0d7377;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    p {
      color: #495057;
      font-weight: 600;
      font-size: 1rem;
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class LoadingComponent {}