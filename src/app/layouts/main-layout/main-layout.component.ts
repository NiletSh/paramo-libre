import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ShelfLiveService } from '../../services/shelf-live.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="main-layout">
      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .main-layout {
      height: 100dvh;
      max-height: 100dvh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #f7f6f1;
    }

    .main-content {
      flex: 1;
      min-height: 0;
      padding-top: 72px;
      overflow-x: hidden;
      overflow-y: auto;
    }
  `]
})
export class MainLayoutComponent {
  constructor(shelfLive: ShelfLiveService) {
    shelfLive.connect();
  }
}
