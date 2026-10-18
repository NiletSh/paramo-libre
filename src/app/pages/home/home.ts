import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { ShareModalComponent } from '../../components/share-modal/share-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ShareModalComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  animations: [
    trigger('rise', [
      transition(':enter', [
        query('.line', [
          style({ opacity: 0, transform: 'translateY(22px)' }),
          stagger(90, [
            animate('780ms cubic-bezier(.16, 1, .3, 1)', style({ opacity: 1, transform: 'none' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('plate', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px) scale(.98)' }),
        animate('1100ms 180ms cubic-bezier(.16, 1, .3, 1)', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class HomeComponent {
  shareOpen = false;

  openShareModal(): void {
    this.shareOpen = true;
  }

  closeShareModal(): void {
    this.shareOpen = false;
  }
}
