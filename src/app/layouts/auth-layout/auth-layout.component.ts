import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .auth-layout {
      min-height: 100dvh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      overflow-x: hidden;
      overflow-y: auto;
      background:
        radial-gradient(circle at top left, rgba(168, 217, 106, 0.42), transparent 34rem),
        linear-gradient(135deg, #f8fdea 0%, #e9f7c8 100%);
      padding: clamp(1rem, 3vw, 2rem);
    }

    @media (min-height: 760px) {
      .auth-layout {
        align-items: center;
      }
    }

    @media (max-width: 560px) {
      .auth-layout {
        padding: 0;
      }
    }
  `]
})
export class AuthLayoutComponent {}
